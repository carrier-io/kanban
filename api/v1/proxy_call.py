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
import requests
import flask_restful  # pylint: disable=E0401
from marshmallow.exceptions import ValidationError
from pylon.core.tools import log  # pylint: disable=E0611,E0401
from tools import auth  # pylint: disable=E0401
from plugins.kanban.schemas.proxy_call import proxy_call_schema


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    def __init__(self, module):
        self.module = module
        self.rpc = self.module.context.rpc_manager.call


    @auth.decorators.check_api({
        "permissions": ["engagements.kanban.proxy_call.create"],
        "recommended_roles": {
            "administration": {"admin": True, "viewer": True, "editor": True},
            "default": {"admin": True, "viewer": True, "editor": True},
            "developer": {"admin": True, "viewer": True, "editor": True},
        }})
    def post(self):
        """ Make proxy call"""
        try:
            meta = proxy_call_schema.load(request.json)
        except ValidationError as err:
            messages = getattr(err, 'messages', None)
            return {"ok":False, "error": {**messages}}, 400
        
        kwargs = {
            'headers':{
                'User-Agent': request.headers['User-Agent'],
                'Origin':request.headers['Origin'],
                'Referer': request.headers['Referer']
            },
            'cookies': {**request.cookies}
        }
        
        if meta.get('payload'):
            kwargs['json'] = meta['payload']

        # making request
        resp = getattr(requests, meta['method'])(meta['url'], **kwargs)
        return {"ok": True, "response": resp.json(), 'response_code': resp.status_code}  
