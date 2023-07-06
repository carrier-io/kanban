function convertDatetime(datetimeStr) {
    const datetimeObj = new Date(datetimeStr);
    const formattedDatetime = `${datetimeObj.getDate().toString().padStart(2, '0')}.${(datetimeObj.getMonth() + 1).toString().padStart(2, '0')}.${datetimeObj.getFullYear()} ${datetimeObj.getHours().toString().padStart(2, '0')}:${datetimeObj.getMinutes().toString().padStart(2, '0')}:${datetimeObj.getSeconds().toString().padStart(2, '0')}`;
    return formattedDatetime;
}

descriptionFormatter = {
    escapeHtml(text) {
        var map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
      
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    getUpdateDesc(log){
        if (log['changes']==null || Object.keys(log['changes']).length==0){
            return ''
        }
        result = `<br/>Changes:<br/>`
        for (key in log['changes']){
            value = log['changes'][key]
            oldValue = descriptionFormatter.escapeHtml(value['old_value'])
            newValue = descriptionFormatter.escapeHtml(value['new_value'])
            result += `${key}: <b> from </b>${oldValue} <b> to </b> ${newValue}`
        }
        return result
    },

    format(value, row){
        extraDesc = ''
        if(row['action'] == 'update'){
            extraDesc = descriptionFormatter.getUpdateDesc(row)
        }

        if (row['auditable_type']=="Issue"){
            return `This ticket was ${row['action']}d` + extraDesc;
        }
        title = `${row['auditable_type']} with id ${row['auditable_id']} was ${row['action']}d in this ticket`
        return title + extraDesc;
    }
}


const TicketActivityContainer = {
    props: ['ticket'],
    watch:{
        ticket: {
            handler(value, oldValue){
                if(value['id'] != oldValue['id']){
                    $('#activity-logs').bootstrapTable('refresh', {
                        url: this.url,
                    });
                    this.toggeTable = false;
                }
            }
        }   
    },
    data(){
        return {
            toggeTable: false,
        }
    },
    methods:{
        isRelavantLog(log){
            id = this.ticket.id
            return (
                (log['auditable_type']=="Issue"&& log['auditable_id']==id) ||
                log.related_entities.some(entity => {
                    return entity['auditable_type'] == "Issue" && entity['auditable_id'] == id
                })
            )
        }
    },
    computed:{
        url(){
            related_fields = JSON.stringify({
                'auditable_type': "Issue",
                "auditable_id": this.ticket.id 
            })
            return `${logs_url}?auditable_type=Issue&auditable_id=${this.ticket.id}&related_entities=${related_fields}`   
        },
        iconClass(){
            return !this.toggeTable ? "icon-arrow-down__16" : "icon-arrow-up__16"
        }
    },
    mounted() {
        $('#activity-logs').bootstrapTable({
            url: this.url
        });
        socket.on('new_log_added', data => {
            if (this.isRelavantLog(data)){
                $('#activity-logs').bootstrapTable('append', data)
            }
        })
    },
    template: `
        <div class="activity-container">
            <div class="title-row">
                <div class="d-flex justify-content-center align-items-end">
                    <div class="label mr-2">
                        Activity
                    </div>
                    <i
                        @click="toggeTable=!toggeTable" 
                        class="icon__16x16"
                        :class="iconClass"    
                    >
                    </i>
                </div>
            </div>

            <div class="w-100" v-show="toggeTable">
                <table class="table table-border"
                    id="activity-logs"
                    data-toggle="table"
                    data-unique-id="id"
                    data-side-pagination="server"
                    data-pagination="true"
                    data-page-list="[10, 25, 50, 100, all]"
                >
                    <thead class="thead-light">
                        <tr>
                            <th scope="col" data-formatter="convertDatetime" data-field="created_at">Date</th>
                            <th scope="col" data-field="user_email">User</th>
                            <th scope="col" data-formatter="descriptionFormatter.format" data-field="description">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    ` 
}

