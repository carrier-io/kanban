const TextEditableField = {
    props: {
        value: {},
        url: {},
        field: {},
        value_class: {
            default: ''
        },
    },
    emits: ['updated'],
    data(){
        return {
            isEditing: false,
            isHovered: false,
        }
    },
    watch: {
        isEditing(newValue){
            if (newValue){
                this.$refs.fieldValue.focus()
            }
        }
    },
    computed: {
        displayFieldName(){
            return this.field.replace('_', " ")
        },
    },
    methods: {
        openEdit(){
            this.isEditing = true;
            this.originalValue = this.$refs.fieldValue.innerHTML;
        },
        closeEdit(){
            this.isEditing = false;
            this.$refs.fieldValue.innerHTML = this.originalValue;
        },
        update(){
            payload = {}
            payload[this.field] = this.$refs.fieldValue.innerHTML
            callMeta = {
                'method':'put',
                'url': this.url,
                'payload': payload
            }
            axios.post(proxyCallUrl, callMeta)
                .then(response => {
                    statusCode = response.data['response_code']
                    if (statusCode != 200){
                        error = response.data['response']['error']
                        showNotify("ERROR", error)
                        return
                    }
                    this.isEditing = false
                    this.$emit('updated', payload)
                });
        },
    },
    template:`
        <div class="desc-row">
            <div class="row-label"><span class="label">{{displayFieldName}}</span></div>
            <div class="row-value wrappable" :class="{'border-wrap': isEditing}" 
                @mouseleave="isHovered=false"
                @mouseover="isHovered=true"
            >
                <div ref="fieldValue" :class="value_class" :contenteditable="isEditing" placeholder="Not Specified">
                    {{value}}
                </div>

                <div>
                    <div v-if="!isEditing && isHovered" class="text-edit">
                        <i @click="openEdit" class="icon__18x18 icon-edit mr-2"></i>
                    </div>

                    <div v-if="isEditing" class="row-actions">
                        <img src="/design-system/static/assets/ico/check_icon.svg" @click="update">
                        <img src="/design-system/static/assets/ico/cancel_icon.svg" @click="closeEdit">
                    </div>
                </div>
            </div>
        </div>
    `
}

const RichTextAreaField = {
    props: {
        value: {},
        url: {},
        field: {},
        value_class: {
            default: ''
        },
    },
    emits: ['updated'],
    data(){
        return {
            isEditing: false,
            isHovered: false,
            originalValue: null,
        }
    },
    computed: {
        displayFieldName(){
            return this.field.replace('_', " ")
        },
        parsedValue(){
            value = this.preprocessMarkdownText(this.value)
            return marked.parse(value, {mangle: false, headerIds: false})
        },  
    },
    methods: {

        preprocessMarkdownText(text) {
            const escapedCharRegex = /\\(.)/g;
            text = text.replace(escapedCharRegex, (match, p1) => p1);
            return text;
        },

        openEditField(){
            this.isEditing = true;
            this.originalValue = this.$refs.fieldValue.innerHTML;
            $(this.$refs.fieldValue).summernote();
        },

        closeEditField(){
            this.isEditing = false;
            $(this.$refs.fieldValue).summernote('destroy');
        },

        cancelEdit(){
            this.closeEditField()
            this.$refs.fieldValue.innerHTML = this.originalValue;
        },

        update(){
            payload = {}
            payload[this.field] = $(this.$refs.fieldValue).summernote('code')
            callMeta = {
                'method':'put',
                'url': this.url,
                'payload': payload
            }
            axios.post(proxyCallUrl, callMeta)
                .then(response => {
                    statusCode = response.data['response_code']
                    if (statusCode != 200){
                        error = response.data['response']['error']
                        showNotify("ERROR", error)
                        return
                    }
                    this.closeEditField()
                    this.$emit('updated', payload)
                });
        },
    },
    template:`
        <div class="desc-row">
            <div class="row-label"><span class="label">{{displayFieldName}}</span></div>
            <div class="row-value wrappable" :class="{'border-wrap': isEditing}" data-id="1" 
                @mouseleave="isHovered=false"
                @mouseover="isHovered=true"
            >
                <div class="rich-text">
                    <div ref="fieldValue" :class="value_class" v-html="parsedValue">
                    </div>    
                </div>
                
                <div>
                    <div v-if="!isEditing && isHovered" class="text-edit" data-id="1">
                        <i @click="openEditField" class="icon__18x18 icon-edit mr-2" data-id="1"></i>
                    </div>

                    <div v-if="isEditing" class="row-actions" data-id="1">
                        <img src="/design-system/static/assets/ico/check_icon.svg" @click="update">
                        <img src="/design-system/static/assets/ico/cancel_icon.svg" @click="cancelEdit">
                    </div>
                </div>
            </div>
        </div>
    `
}

const DropDownField = {
    props: {
        value: {},
        url: {},
        field: {},
        options: {
            default: {}
        },
        value_class: {
            default: ''
        },
    },
    emits: ['updated'],
    data(){
        return {
            isHovered: false,
            newValue: this.value,
        }
    },
    mounted() {
        $(this.$refs.fieldValue).selectpicker('hide')
    },
    watch:{
        isHovered(value){
            if(value){
                this.refreshSelectPicker()
                return $(this.$refs.fieldValue).selectpicker('show')
            }
            $(this.$refs.fieldValue).selectpicker('hide')
        }
    },
    computed: {
        displayFieldName(){
            return this.field.replace('_', " ")
        },

        title(){
            option = this.options.find(option => option.value==this.newValue)
            if (option){
                return option['title']
            }
            return this.newValue
    
        },
    },
    methods: {
        refreshSelectPicker(){
            $(this.$refs.fieldValue).selectpicker('val', this.value)
            $(this.$refs.fieldValue).selectpicker('refresh')
            $(this.$refs.fieldValue).selectpicker('render')
        },
        update(){
            payload = {}
            payload[this.field] = this.newValue
            callMeta = {
                'method':'put',
                'url': this.url,
                'payload': payload
            }
            axios.post(proxyCallUrl, callMeta)
                .then(response => {
                    statusCode = response.data['response_code']
                    if (statusCode != 200){
                        error = response.data['response']['error']
                        showNotify("ERROR", error)
                        return
                    }

                    this.refreshSelectPicker()
                    if (this.field=="engagement"){
                        payload[this.field] = {
                            'name': this.title,
                            'hash_id': this.newValue,
                        }
                    }
                    this.$emit('updated', payload)
                });
        },
    },
    template:`
        <div class="desc-row">
            <div class="row-label"><span class="label">{{displayFieldName}}</span></div>
            <div class="row-value"
                @mouseleave="isHovered=false"
                @mouseover="isHovered=true"
            >
                <div v-if="!isHovered" class="value">{{title}}</div>
                <select
                    ref="fieldValue"
                    @change="update"
                    class="selectpicker bootstrap-select__b bootstrap-select__sm" 
                    data-style="btn" 
                    :name="field"
                    v-model="newValue"
                    id="input-type"
                >
                    <option v-for="option in options" :key="option.value" :value="option.value">
                        {{option.title}}
                    </option>
                </select>
            </div>
        </div>
    `
}

const TagModal = {
    emits: ['tagsUpdate'],
    components: {
        'tag-input': TagInput,
    },
    props: {
        ticketId: {},
        ticketTags: {
            default: [],
        },
    },
    data(){
        return {
            base_url: issue_tags ,
            allTags: [
                {'tag': 'Business', 'color': '#2bd48d'},
                {'tag': 'System', 'color': '#f89033'},
                {'tag': 'Product', 'color':'#f32626'},
            ], 
            selectedTags: []
        }
    },
    computed: {
        url(){
            return this.base_url + this.ticketId
        },
    },
    methods: {
        setTags(tags){
            this.selectedTags = tags
        },
        async updateTags(){
            tags = this.selectedTags.map(tag => {
                return {
                    tag: tag.title,
                    color: tag.hex,
                }
            })
            tags = await this.makeRequest(tags)
            this.$emit('tagsUpdate', tags)
            $("#tagModal").modal("hide")
        },

        async makeRequest(payload){
            const response = await axios.put(this.url, payload)
            return response.data['items']
        },
    },
    template:`
        <div id="tagModal" class="modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Manage Tags</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <tag-input
                            :ticketTags="ticketTags"
                            @updated="setTags"
                        >
                        </tag-input>
                    </div>
                    <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" @click="updateTags" class="btn btn-basic">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `
}

const TagField = {
    props: {
        ticketId: {},
        value: {},
        url: {},
        field: {},
        value_class: {
            default: ''
        },
    },
    emits: ['updated'],
    components: {
        'tag-modal': TagModal,
    },
    data(){
        return {
            isHovered: false,
        }
    },
    computed: {
        displayFieldName(){
            return this.field.replace('_', " ")
        },
    },
    methods: {
        openTagModal(){
            $('#tagModal').css('z-index', 1050)
            $('#tagModal').modal('show');
        },
        onUpdate(tags){
            payload[this.field] = tags
            this.$emit('updated', payload)
        }
    },
    template:`
        <tag-modal
            :ticketId="ticketId"
            :ticketTags="value"
            @tagsUpdate="onUpdate"
        >
        </tag-modal>
        <div class="desc-row">
            <div class="row-label"><span class="label">{{displayFieldName}}</span></div>
            <div class="row-value p-0" data-id="1" 
                @mouseleave="isHovered=false"
                @mouseover="isHovered=true"
            >
            
                <div ref="fieldValue" :class="value_class" class="tags-container wrappable">
                    <div :style="'border-color:' + tag.color" class="ticket-tag" v-for="tag in value" :key="tag.tag">
                        <div :style="'color:' + tag.color" class="tag-text">{{tag.tag}}</div>
                    </div>

                    <div v-if="isHovered" class="text-edit" data-id="1">
                        <i @click="openTagModal" class="icon__18x18 icon-edit mr-2" data-id="1"></i>
                    </div>
                </div>
            </div>
        </div>
    `
}

const TicketDetailContainer = {
    props: ["ticket", "board"],
    emits: ['updated'],
    components: {
        'text-field': TextEditableField,
        'rich-text-area-field': RichTextAreaField,
        'drop-down-field': DropDownField,
        'tag-field': TagField,
    },
    computed:{
        updateUrl(){
            return this.board.state_update_url + '/' + this.ticket.id
        },

        engagementOptions(){
            engs = vueVm.registered_components.engagement_container.engagements
            return engs.filter(eng => eng.id != -1).map(eng => {
                return {
                    title: eng.name,
                    value: eng.hash_id,
                }
            })
        },
        boardOptions(){
            boards = vueVm.registered_components.boards_wrapper.boards
            return boards.filter(board => board.id != -1).map(board => {
                return {
                    title: board.name,
                    value: board.id,
                }
            })
        }
    },
    methods: {
        propagateEvent(data){
            this.$emit('updated', data)
        },
        assignToMe(){
            data = {'assignee': V.user.id}
            callMeta = {
                'method':'put',
                'url': this.updateUrl,
                'payload': data
            }
            axios.post(proxyCallUrl, callMeta)
                .then(response => {
                    statusCode = response.data['response_code']
                    if (statusCode != 200){
                        error = response.data['response']['error']
                        showNotify("ERROR", error)
                        return
                    }
                    showNotify("SUCCESS", "Successfully assigned")
                    this.assignee = V.user
                    data = {'assignee': V.user}
                    this.$emit('updated', data)
                })
        },
    },
    data(){
        return {
            statusOpts: [
                {
                    title: 'Open',
                    value: 'open',
                }, 
                {
                    title: 'Closed',
                    value: 'closed',
                },
                
            ],
            typeOpts: [
                {
                    title: 'Activity',
                    value: 'Activity',
                },
                {
                    title: 'Bug',
                    value: 'Bug',
                },
                {
                    title: 'Risk',
                    value: 'Risk',
                },
            ],
            severityOpts: [
                {
                    title: 'Critical',
                    value: 'critical',
                },
                {
                    title: 'High',
                    value: 'high',
                }, 
                {
                    title: 'Medium',
                    value: 'medium',
                }, 
                {
                    title: 'Low',
                    value: 'low',
                }, 
                {
                    title: 'Info',
                    value: 'info',
                }, 
            ],
            assignee: this.ticket.assignee,
        }
    },
    template: `
        <div class="description-container">
            <rich-text-area-field
                v-if="ticket"
                :value="ticket?.description"
                :url="updateUrl"
                field="description"
                value_class="value"
                @updated="propagateEvent"
            >
            </rich-text-area-field>

            <drop-down-field
                v-if="ticket"
                :value="ticket?.type"
                :url="updateUrl"
                field="type"
                :options="typeOpts"
                @updated="propagateEvent"
            >
            </drop-down-field>

            <drop-down-field
                v-if="ticket"
                :value="ticket?.severity"
                :url="updateUrl"
                field="severity"
                :options="severityOpts"
                @updated="propagateEvent"
            >
            </drop-down-field>

            <drop-down-field
                v-if="ticket"
                :value="ticket?.status"
                :url="updateUrl"
                field="status"
                :options="statusOpts"
                @updated="propagateEvent"
            >
            </drop-down-field>

            <drop-down-field
                v-if="ticket"
                :value="ticket?.engagement.hash_id"
                :url="updateUrl"
                field="engagement"
                :options="engagementOptions"
                @updated="propagateEvent"
            >
            </drop-down-field>

            <drop-down-field
                v-if="ticket"
                :value="ticket?.board_id"
                :url="updateUrl"
                field="board_id"
                :options="boardOptions"
                @updated="propagateEvent"
            >
            </drop-down-field>

            <text-field
                v-if="ticket"
                :value="ticket?.external_link"
                :url="updateUrl"
                field="external_link"
                value_class="value"
                @updated="propagateEvent"
            >
            </text-field>

            <tag-field
                v-if="ticket"
                :ticketId="ticket.id"
                :value="ticket?.tags"
                :url="updateUrl"
                field="tags"
                value_class="value"
                @updated="propagateEvent"
            ></tag-field>

            <div class="desc-row">
                <div class="row-label"><span class="label">Assignee</span></div>
                <div class="row-value">
                    <div>
                        <span class="value mr-2">{{assignee?.name || 'Not specified'}}</span>
                        <a @click="assignToMe"><span class="blue-link">Assign to me</span></a>
                    </div>
                </div>
            </div>
        </div>    
    `
}
