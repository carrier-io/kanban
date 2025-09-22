import flask
import flask_restful
from flask import request, jsonify
from tools import auth, db
from plugins.kanban.models.board import Board
from plugins.kanban.models.board import BoardColumn
from plugins.issues.models.issues import Issue
import uuid
from pylon.core.tools import log


class API(flask_restful.Resource):
    """ Import Board from JSON """
    url_params = ['<int:project_id>']

    def __init__(self, module):
        self.module = module

    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.edit"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": True},
            "default": {"admin": True, "viewer": False, "editor": True},
            "developer": {"admin": True, "viewer": False, "editor": True},
        }})
    def post(self, project_id):
        log.info("*********************************")
        log.info(f"Import API triggered with project id - {project_id}")
        log.info("*********************************")
        if 'file' not in request.files:
            return {"error": "No file uploaded"}, 400
        file = request.files['file']
        try:
            import_data = flask.json.load(file)
        except Exception as e:
            return {"error": f"Invalid JSON: {e}"}, 400

        log.info("*********************************")
        log.info(f"import_data - {import_data}")
        log.info("*********************************")

        board_data = import_data.get("board")
        issues_data = import_data.get("issues", [])



        # Create new Board
        new_board = Board(
            project_id=project_id,
            name=board_data.get("name") + " (Imported)",
            hash_id=str(uuid.uuid4()),
            tickets_url=board_data.get("tickets_url", "").split("?")[0],
            state_update_url=board_data.get("state_update_url", ""),
            mapping_field=board_data.get("mapping_field", ""),
            ticket_name_field=board_data.get("ticket_name_field", ""),
            ticket_id_field=board_data.get("ticket_id_field", ""),
            event_list_url=board_data.get("event_list_url", ""),
            event_detail_url=board_data.get("event_detail_url", ""),
            tickets_attributes=board_data.get("tickets_attributes", []),
            schedules=board_data.get("schedules", []),
        )
        db.session.add(new_board)
        db.session.flush()  # To get new_board.id
        log.info("*********************************")
        log.info(f"After new_board creation")
        log.info("*********************************")

        # Create columns
        old_col_id_to_new = {}
        for col in board_data.get("columns", []):
            new_col = BoardColumn(
                board_id=new_board.id,
                name=col.get("name"),
                order=col.get("order"),
            )
            db.session.add(new_col)
            db.session.flush()
            old_col_id_to_new[col["id"]] = new_col.id

        log.info("*********************************")
        log.info(f"After columns creation")
        log.info("*********************************")

        # Create issues
        for issue in issues_data:
            new_issue = Issue(
                project_id=project_id,
                title=issue.get("title"),
                description=issue.get("description"),
                status=issue.get("status"),
                severity=issue.get("severity"),
                type=issue.get("type"),
                board_id=new_board.id,
                hash_id=str(uuid.uuid4()),  # <-- generate a unique hash_id
                # Add other fields as needed
            )
            db.session.add(new_issue)
            # Optionally handle tags, assignee, dates, etc.

        log.info("*********************************")
        log.info(f"After tickets creation")
        log.info("*********************************")
        db.session.commit()
        log.info("*********************************")
        log.info(f"After db.session.commit()")
        log.info("*********************************")
        return jsonify({"message": "Board imported", "board_id": new_board.id})
