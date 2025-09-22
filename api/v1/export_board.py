import flask
import flask_restful
from tools import auth, db
from flask import send_file
from io import BytesIO
import json
from pylon.core.tools import log

from plugins.kanban.models.board import Board
from plugins.issues.models.issues import Issue  # Adjust if your Issue model is elsewhere

class API(flask_restful.Resource):
    """ Export Board as JSON """
    url_params = ['<string:board_id>']

    def __init__(self, module):
        self.module = module

    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.view"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": True, "editor": True},
            "default": {"admin": True, "viewer": True, "editor": True},
            "developer": {"admin": True, "viewer": True, "editor": True},
        }})
    def get(self, board_id):
        # Get board
        log.info("*************************")
        log.info(f"Triggered Export board API with board_id = {board_id}")
        log.info("*************************")
        board = db.session.query(Board).filter_by(id=board_id).first()
        log.info("*************************")
        log.info(f"board = {board}")
        log.info("*************************")
        if not board:
            return {"error": "Board not found"}, 404

        # Get issues assigned to this board
        issues = db.session.query(Issue).filter_by(board_id=board_id).all()


        # Serialize board
        board_data = {
            "id": board.id,
            "name": board.name,
            "hash_id": board.hash_id,
            "project_id": board.project_id,
            "mapping_field": board.mapping_field,
            "ticket_name_field": board.ticket_name_field,
            "ticket_id_field": board.ticket_id_field,
            "tickets_attributes": board.tickets_attributes,
            "engagement": board.engagement,
            "schedules": board.schedules,
            "tickets_url": board.tickets_url,
            "state_update_url": board.state_update_url,
            "event_list_url": board.event_list_url,
            "event_detail_url": board.event_detail_url,
            "columns": [
                {
                    "id": col.id,
                    "name": col.name,
                    "order": getattr(col, "order", None),
                } for col in board.columns
            ],
        }

        log.info("*************************")
        log.info(f"board_data = {board_data}")
        log.info("*************************")

        # Serialize issues
        issues_data = []
        for issue in issues:
            issues_data.append({
                "id": issue.id,
                "title": getattr(issue, "title", ""),
                "description": getattr(issue, "description", ""),
                "status": getattr(issue, "status", ""),
                "severity": getattr(issue, "severity", ""),
                "type": getattr(issue, "type", ""),
                "tags": getattr(issue, "tags", []),
                # Add more fields as needed
            })

        export_data = {
            "board": board_data,
            "issues": issues_data,
        }

        log.info("*************************")
        log.info(f"export_data = {export_data}")
        log.info("*************************")

        # Prepare JSON file
        json_bytes = json.dumps(export_data, indent=2).encode("utf-8")
        file_obj = BytesIO(json_bytes)
        file_obj.seek(0)
        return send_file(
            file_obj,
            mimetype="application/json",
            as_attachment=True,
            download_name=f"kanban_board_{board_id}_export.json"
        )
