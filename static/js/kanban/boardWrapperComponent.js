const boardWrapper = {
    delimiters: ['[[', ']]'],
    props: [
        'engagement',
        'engagement_list',
    ],

    components: {
        'engagement-aside': EngagementsListAside,
        'engagement-card': TopEngagementCard,
        'ticket-creation-modal': TicketCreationModal,
        'filter-toolbar-container': FilterToolbarContainer,
        'kanban-board': kanbanBoard,
        'board-modal': BoardCreationModal,
        'ticket-view-container': TicketViewContainer,
    },

    data() {
        return {
            boards: [],
            currentBoard: null,
            engagements: [],

            initialUrl: null,
            queryUrl: tickets_api,
            preFilterMap: {},
            
            selectedEngagement: {
                id: -1,
                name: ''
            },
            selectedTicket: null,
            scrolledPositionY: 0,
            modalZIndex: 0,
        }
    },

    watch: {
        currentBoard(newBoard){
            this.initialUrl = newBoard?.tickets_url 
        },

        async engagement(value){
            notAllEngagements = value.id!=-1
            window.scrollTo(0,0);
            this.queryUrl = null;
            if (notAllEngagements){
                this.preFilterMap = {"engagement": value.hash_id};
                await this.fetchBoards()
                this.setSelectedEngagement(value)
            } else {
                delete this.preFilterMap['engagement']
                await this.fetchBoards()
                this.setSelectedEngagement(value)
            }
        },
    },

    async mounted(){
        $(this.clone_modal_id).on('show.bs.modal', () => {
            txt = ""
            this.boards.forEach(board => {
                txt += `<option value="${board.id}">${board.name}</option>`
            })
            $('#existingBoardSelect').append(txt)
            
            boardsTabSelected = $("a#existing-boards-tab").hasClass('active')
            if(boardsTabSelected){
                this.setCloneBoardInput()
            }
        });

        $(this.clone_modal_id).on('hidden.bs.modal', function(){
            $('#existingBoardSelect').empty()
            $("#cloneBoardConfig").val('')
            $("#board-upload").val(null)
            $("#boardPreviewArea").empty()
        });

        $('#existingBoardSelect').change(() => {
            this.setCloneBoardInput()
        });

        $(this.clone_btn_id).click(()=>{
            configTxt = $("#cloneBoardConfig").val()
            try {
                payload = JSON.parse(configTxt)
            }
            catch(err){
                showNotify("ERROR", "Invalid JSON")
                return 
            } 
            axios.post(board_clone_url, payload).then(resp => {
                this.boardCreationHandler(resp, this.clone_modal_id)
            }).catch(error => {
                msg = error.response.data['error']
                showNotify("ERROR", msg)
            })
        });

        $("#board-upload").change(() => {
            this.readSingleFile()
        })

        $("#upload-template-tab").click(() => {
            this.readSingleFile()
        });
        
        $("#existing-boards-tab").click(() => {
            this.setCloneBoardInput()
        });

        $("#boards-select").on('changed.bs.select', (e, clickedIndex, isSelected, previousValue) => {
            this.currentBoard = this.boards[clickedIndex]
        });
        
    },

    methods:{
        handleTicketChange(ticket, position=0){
            this.selectedTicket = ticket
            boardEl = $(this.$refs.boardWrapper)
            if(ticket){
                if(!boardEl.hasClass('d-none')){
                    this.scrolledPositionY = position
                    boardEl.addClass("d-none")
                    window.scrollTo({top: 0, behavior: "smooth"});
                }
            } else {
                boardEl.removeClass("d-none")
                window.scrollTo({top: this.scrolledPositionY, behavior: "smooth"})
            }
        },

        updateHandler(board){
            this.REMOVE_BOARD_MUTATION(board.id)
            this.ADD_BOARD_MUTATION(board)
            this.SET_CURRENT_BOARD_MUTATION(board.id)
            this.refreshBoardSelect()
        },

        async fetchBoards(){
            const resp = await axios.get(boards_url, {params: this.preFilterMap})
            this.boards = resp.data['items']
            this.currentBoard = this.boards.length==0 ? null: this.boards[0]
            this.refreshBoardSelect();
        },

        setBoardOptions(boards, currentBoardId){
            tagText = boards.reduce((acc, curr)=>{
                selected = currentBoardId && curr.hash_id == currentBoardId ? "selected" : "" 
                return acc + `<option value="${curr.hash_id}" ${selected}>${curr.name}</option>`            
            }, '')
            $("#boards-select").append(tagText)
            $("#boards-select").selectpicker('refresh')
            $("#boards-select").selectpicker('render')
        },

        refreshBoardSelect(){
            $("#boards-select").empty()
            this.setBoardOptions(this.boards, this.currentBoard?.hash_id)
        },

        readSingleFile() {
            var file = $("#board-upload").prop('files')[0];
            if (!file) {
              $("#cloneBoardConfig").val('')
              return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
              var contents = e.target.result;
              $("#cloneBoardConfig").val(contents)
            };
            reader.readAsText(file);
        },

        setCloneBoardInput(){
            boardId = $('#existingBoardSelect').val()
            config = this.getConfigFromBoard(boardId)
            $("#cloneBoardConfig").val(config)
        },

        boardCreationHandler(resp_data){
            this.ADD_BOARD_MUTATION(resp_data)
            this.SET_CURRENT_BOARD_MUTATION(resp_data.id)
            this.refreshBoardSelect()
        },

        getConfigFromBoard(boardId){
            boards = this.boards.filter(board => board.id == boardId)
            if (boards.length == 0){
                return
            }
            board = JSON.parse(JSON.stringify(boards[0]))
            config = this.removeIdsFromObject(board)
            config['columns'] = this.flattenList(config.columns, 'name')
            return JSON.stringify(config, undefined, 4)
        },

        removeIdsFromObject(object){
            token = 'id'
            for (attr in object){
                if (attr.includes(token) && !attr.includes('field')){
                    delete object[attr]
                    continue
                }
                if (typeof object[attr] == 'object'){
                    this.removeIdsFromObject(object[attr])
                }    
            }
            return object
        },

        flattenList(objectList, field){
            result = []
            objectList.forEach(object => {
                result.push(object[field])
            })
            return result
        },

        onSelectChange(event){
            boardId = event.target.value
            this.SET_CURRENT_BOARD_MUTATION(boardId)
        },

        onDeleteBoard(){
            if (!this.currentBoard)
                return 
            boardId = this.currentBoard.id
            axios.delete(board_url+'/'+boardId)
                .then(() => {
                    this.REMOVE_BOARD_MUTATION(boardId)
                    firstEl = this.boards.find(() => true)
                    boardId = firstEl ? firstEl.id : null
                    this.SET_CURRENT_BOARD_MUTATION(boardId)
                    showNotify("SUCCESS")
                })
                .catch(error => console.log(error))
        },

        SET_CURRENT_BOARD_MUTATION(boardId){
            ind = this.boards.findIndex(board => board.id == boardId)
            this.currentBoard = this.boards[ind]
        },

        ADD_BOARD_MUTATION(board){
            this.boards.push(board)
        },
        
        REMOVE_BOARD_MUTATION(boardId){
            ind = this.boards.findIndex(board => board.id == boardId)
            this.boards.splice(ind, 1)
            this.refreshBoardSelect()
        },

        updateEngagements(engagements){
            this.engagements = engagements
        },

        setSelectedEngagement(engagement){
            this.selectedEngagement = engagement
        },

        refreshBoard(url){
            return this.queryUrl = url
        },

        handleBoardUrlChange(url){
            this.queryUrl = null
            this.initialUrl = url
        },

        openCreateModal(){
            $("#board_create_modal").modal('show')
        },

        openEditModal(){
            $("#board_create_modal").data('isEdit', true)
            $("#board_create_modal #modal-title").text('Edit board')
            $("#board_create_modal").modal('show')
        },

        openEventModal(){
            if (!this.currentBoard)
                return
            $("#kanban_event_modal").modal('show')
        }
    },

    template: `
        <div>
            <div id="boardWrapper" class="card mt-3" ref="boardWrapper">
                <div class="card-container" id="boardToolbar">
                    <filter-toolbar-container
                        variant="slot"
                        :url="initialUrl"
                        resp_data_field="rows"
                        button_class="btn-sm btn-icon__sm btn-secondary"
                        :list_items="['severity', 'type', 'source', 'status', 'tags']"
                        :pre_filter_map="preFilterMap"
                        @applyFilter="refreshBoard"
                    >
                        <template #before>
                            <h4 class="kanban-card-header-title mr-2">Board</h4>         
                            <select class="selectpicker mr-2" data-style="btn" id="boards-select">
                            </select>
                            <div class="dropdown dropleft dropdown_action">
                                <button class="btn-sm mr-2 dropdown-toggle btn-icon__sm dropdown-toggle btn-secondary"
                                        role="button"
                                        id="dropdownMenuLinkSm"
                                        data-toggle="dropdown"
                                        aria-expanded="false">
                                    <i class="fa fa-ellipsis-v"></i>
                                </button>

                                <ul class="dropdown-menu" aria-labelledby="dropdownMenuLinkSm">
                                    <li @click="openCreateModal" class="dropdown-item d-flex align-items-center"><i class='icon__18x18 icon-create-element mr-2'></i>New board</li>
                                    <li class="dropdown-item d-flex align-items-center border-bottom"><i class='icon__18x18 icon-download mr-2'></i>Import</li>
                                    
                                    <li :class="{disabled_option:!currentBoard}" class="dropdown-item d-flex align-items-center">
                                        <i :class="{disabled_option_icon:!currentBoard}" class='icon__18x18 icon-upload mr-2'></i>Export
                                    </li>
                                    <li @click="openEditModal" :class="{disabled_option:!currentBoard}" class="dropdown-item d-flex align-items-center">
                                        <i :class="{disabled_option_icon:!currentBoard}" class='icon__18x18 icon-edit mr-2'></i>Edit
                                    </li>    
                                    <li @click="onDeleteBoard" class="dropdown-item d-flex align-items-center border-bottom" :class="{disabled_option:!currentBoard}">
                                        <i class='icon__18x18 icon-delete mr-2' :class="{disabled_option_icon:!currentBoard}"></i>Delete
                                    </li>
                                    <li @click="openEventModal" class="dropdown-item d-flex align-items-center"><i class='icon__18x18 icon-settings mr-2'></i>Manage events</li>
                                </ul>
                            </div>
                        </template>

                        <template #dropdown_button><i class="fa fa-filter"></i></template>
                        <template #after>
                            <div class="d-flex justify-content-end align-items-center">
                                <ticket-creation-modal
                                    :engagement="selectedEngagement"
                                >
                                </ticket-creation-modal>  
                            </div>
                        </template>

                    </filter-toolbar-container>
                </div>

                <board-modal
                    :engagement="selectedEngagement"
                    :board="currentBoard"
                    :queryUrl="queryUrl"
                    @updated="updateHandler"
                    @created="boardCreationHandler"
                >
                </board-modal>

                <div class="board-container">
                    <kanban-board
                        :engagement="selectedEngagement"
                        :queryUrl="queryUrl"
                        ref="board"
                        v-if="currentBoard"
                        :board="currentBoard"
                        :updatedTicket="selectedTicket"
                        @ticketSelected="handleTicketChange"
                        @boardUrlChanged="handleBoardUrlChange"
                    >
                    </kanban-board>
                </div>
            </div>

            <ticket-view-container
                v-if="selectedTicket"
                ref="viewContainer"
                :ticket="selectedTicket"
                :board="currentBoard"
                @updated="handleTicketChange"
            >
            </ticket-view-container>
        </div>
`
} 

register_component('boardWrapper', boardWrapper)