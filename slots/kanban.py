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

""" Slot """

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import web  # pylint: disable=E0611,E0401

from tools import auth  # pylint: disable=E0401
from tools import theme  # pylint: disable=E0401
from tools import session_project


class Slot:  # pylint: disable=E1101,R0903
    """ Slot Resource """

    @web.slot("orch_slot_kanban_content")
    @auth.decorators.check_slot({
        "permissions": ["engagements.kanban"]
    })
    def _orch_slot_kanban_content(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                "kanban/content.html", project_id=session_project.get()
            )
    

    @web.slot("orch_slot_kanban_styles")
    def _orch_slot_kanban_styles(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template("kanban/styles.html")


    @web.slot("orch_slot_kanban_scripts")
    def _orch_slot_kanban_scripts(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template("kanban/scripts.html", project_id=session_project.get())
