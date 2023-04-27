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

from flask import request
import flask_restful  # pylint: disable=E0401
from marshmallow.exceptions import ValidationError

# from pylon.core.tools import log  # pylint: disable=E0611,E0401
from tools import auth  # pylint: disable=E0401
from plugins.kanban.schemas.comment import comment_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<string:id>']

    def __init__(self, module):
        self.module = module


    @auth.decorators.check_api({
        "permissions": ["orchestration.kanban.comments.edit"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": True},
            "default": {"admin": True, "viewer": False, "editor": True},
            "developer": {"admin": True, "viewer": False, "editor": True},
        }})
    def put(self, id):
        "Update comment"
        payload = request.json
        try:
            payload = comment_schema.load(payload, partial=True)
        except ValidationError as err:
            messages = getattr(err, 'messages', None)
            return {"ok":False, "error": {**messages}}

        result = self.module.update_comment(id, payload)
        if not result['ok']:
            return result, 404
        
        result['item'] = comment_schema.dump(result['item'])
        return result, 200


    @auth.decorators.check_api({
        "permissions": ["orchestration.kanban.comments.delete"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": False},
            "default": {"admin": True, "viewer": False, "editor": False},
            "developer": {"admin": True, "viewer": False, "editor": False},
        }})
    def delete(self, id):
        "Delete comment"
        result = self.module.delete_comment(id)
        status_code = 200 if result['ok'] else 404
        return result, status_code
