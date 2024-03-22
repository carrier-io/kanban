#!/usr/bin/python3
# coding=utf-8

#   Copyright 2022 getcarrier.io
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

""" API """
import flask  # pylint: disable=E0401
import flask_restful  # pylint: disable=E0401
from marshmallow.exceptions import ValidationError

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from queue import Empty
from tools import auth, session_project  # pylint: disable=E0401
from plugins.kanban.schemas.board import board_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<string:id>']

    def __init__(self, module):
        self.module = module


    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.edit"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": True},
            "default": {"admin": True, "viewer": False, "editor": True},
            "developer": {"admin": True, "viewer": False, "editor": True},
        }})
    def put(self, id):
        "Update board"
        project_id = session_project.get()
        payload = flask.request.json
        active = True if payload.pop("active") == "true" else False
        schedule_name = payload.pop("schedule_name")
        recipients = payload.pop("recipients")
        smtp_integrations = payload.pop("smtp_integrations")
        cron = payload.pop("cron")
        schedule = {"active": active, "schedule_name": schedule_name, "recipients": recipients,
                    "smtp_integrations": smtp_integrations, "cron": cron}

        log.info("Add or Update schedule")
        try:
            schedule_data = {
                "name": f"{schedule_name}_{project_id}_{id}",
                "cron": cron,
                "active": active,
                "rpc_func": "scheduling_kanban_board_status",
                "rpc_kwargs" : {"smtp_integrations": smtp_integrations, "recipients": recipients,
                                "project_id": project_id, "board_id": id}
            }
            all_schedules = self.module.context.rpc_manager.timeout(10).get_schedules()
            for each in all_schedules:
                if each.name == schedule_data["name"]:
                    deleted_schedule = self.module.context.rpc_manager.timeout(10).scheduling_delete_schedules(delete_ids=[each.id])
                    log.info(f"Deleted schedule: {deleted_schedule}")
            schedule_pd = self.module.context.rpc_manager.timeout(10).scheduling_create_schedule(schedule_data=schedule_data)
            log.info(f'Created schedule {schedule_pd}')
        except Empty:
            log.warning('No scheduling rpc found')

        payload["schedules"] = [schedule]
        try:
            payload = board_schema.load(payload, partial=True)
        except ValidationError as err:
            messages = getattr(err, 'messages', None)
            return {"ok": False, "error": {**messages}}

        result = self.module.update_board(id, payload)
        if not result['ok']:
            return result, 404
        
        result['item'] = board_schema.dump(result['item'])
        return result, 200


    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.delete"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": False},
            "default": {"admin": True, "viewer": False, "editor": False},
            "developer": {"admin": True, "viewer": False, "editor": False},
        }})
    def delete(self, id):
        "Delete attachment"
        result = self.module.delete_board(id)
        status_code = 200 if result['ok'] else 404
        return result, status_code
