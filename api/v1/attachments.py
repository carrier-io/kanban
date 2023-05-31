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
import os
from flask import request, url_for
from werkzeug.utils import secure_filename
import flask_restful  # pylint: disable=E0401
# from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401
from plugins.kanban.utils import make_unique_filename
from plugins.kanban.schemas.attachment import attachments_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<int:project_id>/<string:hash_id>']

    def __init__(self, module):
        self.module = module


    @auth.decorators.check_api({
        "permissions": ["orchestration.kanban.attachments.view"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": True, "editor": True},
            "default": {"admin": True, "viewer": True, "editor": True},
            "developer": {"admin": True, "viewer": True, "editor": True},
        }})
    def get(self, project_id, hash_id):
        """ Get all attachments"""
        attachments = self.module.list_ticket_attachments(hash_id)
        attachments = attachments_schema.dump(attachments)
        return {"ok": True, "items":attachments}


    @auth.decorators.check_api({
        "permissions": ["orchestration.kanban.attachments.create"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": False, "editor": True},
            "default": {"admin": True, "viewer": False, "editor": True},
            "developer": {"admin": True, "viewer": False, "editor": True},
        }})
    def post(self, project_id, hash_id):
        """ Get all attachments"""

        files = request.files.getlist("files[]")
        if not files:
            return {"ok":False, "error": "Empty payload"}

        attachments = []
        for file in files:
            filename = make_unique_filename(secure_filename(file.filename))
            full_path = os.path.join(
                self.module.context.settings['application']['KANBAN_UPLOAD_FOLDER'], 
                filename
            )
            file.save(full_path)
            attachments.append({
                'file_name':file.filename,
                'url': url_for('api.v1.kanban.attachment_download', name=filename, _external=True),
                'issue_hash_id':hash_id,
                'full_path':full_path,
            })
        
        result = self.module.add_batch_attachments(attachments)

        if not result['ok']:
            return result, 400
        
        result['items'] = attachments_schema.dump(result['items'])
        return result, 200
