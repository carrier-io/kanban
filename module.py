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

""" Module """

import sqlalchemy  # pylint: disable=E0401

from pylon.core.tools import log  # pylint: disable=E0401
from pylon.core.tools import module  # pylint: disable=E0401
from pylon.core.tools.context import Context as Holder  # pylint: disable=E0401

from tools import theme  # pylint: disable=E0401
from plugins.kanban.utils import create_db_tables


class Module(module.ModuleModel):
    """ Pylon module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor
        #
        self.db = Holder()  # pylint: disable=C0103
        self.db.tbl = Holder()

    def init(self):
        """ Init module """
        log.info("Initializing module")

        # DB
        create_db_tables(self.context.app)
        
        # Theme registration
        theme.register_subsection(
            "orch_tool",
            "kanban", "Kanban",
            title="Kanban",
            kind="slot",
            permissions={
                "permissions": ["orchestration.kanban"],
                "recommended_roles": {
                    "administration": {"admin": True, "viewer": True, "editor": True},
                    "default": {"admin": True, "viewer": True, "editor": True},
                    "developer": {"admin": True, "viewer": True, "editor": True},
                }},
            prefix="orch_slot_kanban_",
        )
        # Init services
        self.descriptor.init_all()
        

    def deinit(self):  # pylint: disable=R0201
        """ De-init module """
        log.info("De-initializing module")
        # De-init slots
        # self.descriptor.deinit_slots()
        # De-init blueprint
        # self.descriptor.deinit_blueprint()
        # De-init SocketIO
        # self.descriptor.deinit_sio()
        # De-init API
        # self.descriptor.deinit_api()
        # De-init RPCs
        # self.descriptor.deinit_rpcs()
