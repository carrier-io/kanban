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

from datetime import datetime
from marshmallow.exceptions import ValidationError
import flask  # pylint: disable=E0401
import flask_restful  # pylint: disable=E0401

# from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401
from plugins.kanban.schemas.attachment import attachment_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<string:id>']

    def __init__(self, module):
        self.module = module


    @auth.decorators.check_api(["global_admin"])
    def put(self, id):
        "Update attachment"
        payload = flask.request.json
        try:
            payload = attachment_schema.load(payload, partial=True)
        except ValidationError as err:
            messages = getattr(err, 'messages', None)
            return {"ok":False, "error": {**messages}}

        result = self.module.update_attachment(id, payload)
        if not result['ok']:
            return result, 404
        
        result['item'] = attachment_schema.dump(result['item'])
        return result, 200


    @auth.decorators.check_api(["global_admin"])
    def delete(self, id):
        "Delete attachment"
        result = self.module.delete_attachment(id)
        status_code = 200 if result['ok'] else 404
        return result, status_code
