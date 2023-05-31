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
import uuid
from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import web  # pylint: disable=E0611,E0401

from tools import db_orch as db  # pylint: disable=E0401
# from tools import db_tools  # pylint: disable=E0401
from tools import rpc_tools, session_project  # pylint: disable=E0401

from plugins.kanban.models.board import Board, BoardColumn


class RPC:  # pylint: disable=E1101,R0903
    """ RPC Resource """

    @web.rpc("kanban_create_board", "create_board")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def create_board(self, project_id, data):
        try:
            if not data['name']:
                return {"ok":False, "error": "Name is empty string"}

            columns = data.pop('columns')
            data['hash_id'] = uuid.uuid4()
            board = Board(project_id=project_id, **data)
            db.session.add(board)

            for index, column_name in enumerate(columns):
                column = BoardColumn(board=board, name=column_name, order=index)
                db.session.add(column)

            db.session.commit()
        except Exception as e:
            log.error(e)
            db.session.rollback()
            return {"ok":False, "error":str(e)}
        
        return {"ok":True, "item":board}


    @web.rpc("kanban_list_boards", "list_boards")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def list_boards(self, project_id, query: dict = {}):
        base_query = Board.query.filter_by(project_id=project_id, **query)
        boards = base_query.all()
        total = base_query.count()
        return {'items':boards, 'ok':True, 'total': total}


    @web.rpc("kanban_delete_board", "delete_board")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _delete_board(self, id):
        board = Board.query.get(id)
        if not board:
            return {"ok":False, "error":'Not Found'}
        
        db.session.delete(board)
        db.session.commit()
        return {"ok":True}


    @web.rpc("kanban_update_board", "update_board")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def _update_board(self, id, payload):
        board = Board.query.get(id)
        if not board:
            return {"ok":False, "error":'Not Found'}

        columns = payload.pop('columns')
        if columns:
            # delete columns of board
            db.session.query(BoardColumn).filter(BoardColumn.board_id==board.id).delete()
            
            # adding columns
            for index, column_name in enumerate(columns):
                column = BoardColumn(board=board, name=column_name, order=index)
                db.session.add(column)


        for field, value in payload.items():
            if hasattr(board, field):
                setattr(board, field, value)

        db.session.commit()
        return {"ok":True, "item": board}
    

    @web.rpc("kanban_list_board_columns", "list_board_columns")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def list_board_columns(self, board_id):
        columns = BoardColumn.query.filter_by(board_id=board_id)
        return {"ok":True, "items":columns}


    @web.rpc("kanban_clone_board", "clone_board")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def clone_board(self, config:dict):
        # creating a board
        project_id = session_project.get()
        board_result = RPC.create_board(self, project_id, config)
        if not board_result['ok']:
            return board_result

        board = board_result['item']
        result = {'ok': True}
        result['msg'] = "Successfully created"
        result['item'] = board
        return result