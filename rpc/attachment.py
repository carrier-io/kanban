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
from typing import Dict, List

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import web  # pylint: disable=E0611,E0401

from tools import db_orch as db  # pylint: disable=E0401
# from tools import db_tools  # pylint: disable=E0401
from tools import rpc_tools  # pylint: disable=E0401

from plugins.kanban.models.attachment import Attachment


class RPC:  # pylint: disable=E1101,R0903
    """ RPC Resource """

    @web.rpc("kanban_list_ticket_attachments", "list_ticket_attachments")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _list_ticket_attachments(self, hash_id):
        return Attachment.query.filter_by(issue_hash_id=hash_id)


    @web.rpc("kanban_add_batch_attachments", "add_batch_attachments")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _add_batch_attachments(self, attachments:List[Dict]):
        result = []
        try:
            for attach in attachments:
                attachment = Attachment(**attach)
                db.session.add(attachment)
                db.session.flush()
                result.append(attachment)
            db.session.commit()
        except Exception as e:
            log.error(e)
            db.session.rollback()
            return {"ok":False, "error":str(e)}
        
        return {"ok":True, "items":result}


    @web.rpc("kanban_update_attachment", "update_attachment")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _update_attachment(self, id, payload):
        attachment = Attachment.query.get(id)
        if not attachment:
            return {"ok":False, "error":'Not Found'}

        for field, value in payload.items():
            if hasattr(attachment, field):
                setattr(attachment, field, value)

        db.session.commit()
        return {"ok":True, "item": attachment}


    @web.rpc("kanban_delete_attachment", "delete_attachment")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _delete_attachment(self, id):
        attachment = Attachment.query.get(id)

        if not attachment:
            return {"ok":False, "error":'Not Found'}
        
        db.session.delete(attachment)
        db.session.commit()
        
        return {"ok":True}
        

