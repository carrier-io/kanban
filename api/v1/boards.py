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
import flask_restful  # pylint: disable=E0401
from flask import request
from marshmallow.exceptions import ValidationError
from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import auth, api_tools  # pylint: disable=E0401

from plugins.kanban.schemas.board import board_schema, boards_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<int:project_id>']


    def __init__(self, module):
        self.module = module
        self.rpc = self.module.context.rpc_manager.call


    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.view"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": True, "editor": True},
            "default": {"admin": True, "viewer": True, "editor": True},
            "developer": {"admin": True, "viewer": True, "editor": True},
        }})
    @auth.decorators.check_api(['global_admin'])
    def get(self, project_id):
        """ Get all boards"""
        args = dict(request.args)
        limit = args.pop('limit', 0)
        offset = args.pop('offset', 0)
        result = self.module.list_boards(project_id, query=args)
        result['items'] = boards_schema.dump(result['items'])
        return result, 200
    

    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.boards.create"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": True},
            "default": {"admin": True, "viewer": False, "editor": True},
            "developer": {"admin": True, "viewer": False, "editor": True},
        }})
    def post(self, project_id):
        """ Create board"""
        payload = request.json
        active = payload.pop("active")
        schedule_name = payload.pop("schedule_name")
        recipients = payload.pop("recipients")
        smtp_integrations = payload.pop("smtp_integrations")
        cron = payload.pop("cron")
        schedule = {"active": False, "schedule_name": schedule_name, "recipients": recipients,
                    "smtp_integrations": smtp_integrations, "cron": cron}
        payload["schedules"] = [schedule]
        try:
            payload = board_schema.load(payload)
        except ValidationError as err:
            log.info(err)
            messages = getattr(err, 'messages', None)
            return {"ok":False, "error": {**messages}}

        result = self.module.create_board(project_id, payload)
        
        if not result["ok"]:
            return result, 400

        result['item'] = board_schema.dump(result['item']) 
        return result, 201


        
