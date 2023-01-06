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
from flask import request
import flask_restful  # pylint: disable=E0401
from flask_restful import reqparse, inputs

# from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401
from pylon.core.tools import log


class API(flask_restful.Resource):  # pylint: disable=R0903
    """ API Resource """

    def __init__(self, module):
        self.module = module
        self.rpc = self.module.context.rpc_manager.call


    @auth.decorators.check_api(['global_admin'])
    def get(self):
        """ Get all vulnerabilities"""

        search_text = request.args.get("search", None, type=str)
        offset = request.args.get('offset', 0, type=int)
        limit = request.args.get('limit', 10, type=int)

        total, data = self.rpc.issue_list_issues(
            limit=limit, 
            offset=offset, 
            search=search_text,
        )
        for issue in data:
            issue['source'] = self.rpc.cs_get_cs_hash_id(issue['hash_id'])
            for key, value in issue.items():
                if isinstance(value, datetime):
                    issue[key] = str(value)
        
        return {"ok": True, "total": total, "rows":data}
