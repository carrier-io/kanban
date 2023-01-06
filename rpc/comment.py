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

""" RPC """
from typing import Dict

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import web  # pylint: disable=E0611,E0401

from tools import db_orch as db  # pylint: disable=E0401
# from tools import db_tools  # pylint: disable=E0401
from tools import rpc_tools  # pylint: disable=E0401

from plugins.kanban.models.comment import Comment


class RPC:  # pylint: disable=E1101,R0903
    """ RPC Resource """

    @web.rpc("kanban_list_ticket_comments", "list_ticket_comments")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def list_ticket_comments(self, hash_id):
        return Comment.query.filter_by(issue_hash_id=hash_id)


    @web.rpc("kanban_add_comment", "add_comment")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def add_comment(self, payload:Dict):
        try:
            comment = Comment(**payload)
            db.session.add(comment)
            db.session.flush()
            db.session.commit()
        except Exception as e:
            log.error(e)
            db.session.rollback()
            return {"ok":False, "error":str(e)}
        
        return {"ok":True, "item":comment}


    @web.rpc("kanban_update_comment", "update_comment")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def update_comment(self, id, payload):
        comment = Comment.query.get(id)
        if not comment:
            return {"ok":False, "error":'Not Found'}

        for field, value in payload.items():
            if hasattr(comment, field):
                setattr(comment, field, value)

        db.session.commit()
        return {"ok":True, "item": comment}


    @web.rpc("kanban_delete_comment", "delete_comment")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def delete_comment(self, id):
        comment = Comment.query.get(id)
        log.info(comment)

        if not comment:
            return {"ok":False, "error":'Not Found'}
        
        db.session.delete(comment)
        db.session.commit()
        
        return {"ok":True}
        

