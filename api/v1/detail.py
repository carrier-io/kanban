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

import flask  # pylint: disable=E0401
import flask_restful  # pylint: disable=E0401

# from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    url_params = ['<string:hash_id>']

    def __init__(self, module):
        self.module = module
        self.rpc = module.context.rpc_manager.call

    @auth.decorators.check_api(["global_admin"])
    def get(self, hash_id):
        "Get Kanban ticket"
        issue = self.rpc.issue_get_issue_hash_id(hash_id)
        issue['source'] = self.rpc.cs_get_cs_hash_id(hash_id)
        for key, value in issue.items():
            if isinstance(value, datetime):
                issue[key] = str(value)
                
        return {"ok": True, "item":issue}
