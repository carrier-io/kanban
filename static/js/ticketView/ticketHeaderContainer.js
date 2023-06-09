const TicketHeaderContainer = {
    props: {
        ticket: {},
    },
    computed: {
        updateUrl(){
            return ticketUrl + this.ticket.id
        },
    },
    emits: ['updated', 'close'],
    watch: {
        isEditing(newValue){
            if (newValue){
                this.$refs.fieldValue.focus()
            }
        }
    },
    methods: {
        close(){
            this.$emit('close', null)
        },
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
            payload['title'] = this.$refs.fieldValue.innerHTML
            axios.put(this.updateUrl, payload)
            .then(() => {
                this.isEditing = false
                this.$emit('updated', payload)
            })
        },
    },
    data(){
        return {
            isEditing: false,
            isHovered: false,
        }
    },
    template: `
        <div class="ticket-header-container">
            <div class="header-row">
                
                <div class="mr-2">
                    <i @click="close" class="icon__16x16 icon-single-arrow-left__16"></i>
                </div>

                <div class="row-value wrappable"  
                    @mouseleave="isHovered=false"
                    @mouseover="isHovered=true"
                    :class="{'border-wrap': isEditing}"
                    style="padding: 4px"
                >
                    <div
                        ref="fieldValue" 
                        :contenteditable="isEditing" 
                        class="ticket-header" 
                    >
                        {{ticket?.title}}
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
        </div>
    `
}