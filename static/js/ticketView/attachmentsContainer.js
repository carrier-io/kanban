const TicketAttachmentsContainer = {
    props: ["ticket"],
    watch: {
        async ticket(){
            await this.fetchAttachments()
        } 
    },
    async mounted() {
        if(!this.ticket)
            return
        await this.fetchAttachments()
    },
    data() {
        return {
            attachments: [],
            hoveredItemIds: new Set(),
        }
    },
    computed: {
        url(){
            return attachmentsUrl + this.ticket.id
        },
    },
    methods: {
        ADD_ATTACHMENT(attachment){
            this.attachments.push(attachment)
        },

        REMOVE_ATTACHMENT(attachmentId){
            ind = this.attachments.findIndex(attch => attch.id == attachmentId)
            this.attachments.splice(ind, 1)
        },

        async fetchAttachments(){
            response = await axios.get(this.url)
            this.attachments = response.data['items']
        },

        showTrashIcon(id){
            if(!this.hoveredItemIds.has(id)){
                this.hoveredItemIds.add(id)
            }
        },

        hideTrashIcon(id){
            if (this.hoveredItemIds.has(id)){
                this.hoveredItemIds.delete(id)
            }
        },

        openAttachmentModal(){
            $('#input-attachments').trigger('click');
        },

        uploadImage(){
            var formData = new FormData();
            var files = $("#input-attachments")[0].files
         
            // return if no file has been selected
            if (files.length==0) return

            for (let i=0; i<files.length; i++){
                formData.append("files[]", files[i])
            }

            axios.post(this.url, payload=formData)
                .then(response => {
                    $("#input-attachments").val(null);
                    response['data']['items'].forEach(attachment => {
                        this.ADD_ATTACHMENT(attachment)
                    })
                    showNotify("SUCCESS")
                })
                .catch(()=>{
                    showNotify("ERROR", 'File uploading failed')
                })
        },

        deleteAttachment(event){
            id = event.target.dataset['id']
            axios.delete(attachmentUrl + id)
                .then(resp => {
                    this.REMOVE_ATTACHMENT(id)
                    showNotify("SUCCESS", "Successfuly deleted")
                })
                .catch(err => {
                    console.log(err)
                    showNotify("ERROR")
                })
        },

        formatName(name){
            return name.length > 17 ? name.slice(0,17) + "..." : name
        },

        formatDate(dateStr){
            date = new Date(dateStr)
            day = date.getDate();
            day = day < 10 ? '0' + day: `${day}`
            year = date.getFullYear()
            month = date.getMonth()
            month = month < 10 ? '0' + month: `${month}`
            return `${day}.${month}.${year}`
        },

        getDisplayFileUrl(url){
            if (!url)
                // for non-image attachements
                return "/kanban/static/img/no_image.png"
            return url
        },

        openImage(event){
            url = event.target.dataset['url']
            url && window.open(url)
        }
    },
    template: `
    <div class="attachment-container">
        <div class="title-row">
            <div class="label">
                Attachments
            </div>
            <input @change="uploadImage" type="file" id="input-attachments" style="display:none" multiple>
            <div @click="openAttachmentModal" class="d-flex justify-content-center align-items-center">
                <i class="icon__16x16 icon-plus__16 mr-1" style="background: #2772E2"></i>
                <span class="blue-link  mr-2">Attachment</span>
            </div>
        </div>
        <div class="files">

            <div class="card file" @mouseover="showTrashIcon(attachment.id)" @mouseleave="hideTrashIcon(attachment.id)" v-for="attachment in attachments" :key="attachment.id">   
                    <div class="attch-img" :data-id="attachment.id">
                        <img
                            class="card-img-top custom-card-img"
                            :src="getDisplayFileUrl(attachment.thumbnail_url)"
                            style="width:100%"
                            @click="openImage"
                            :data-url="attachment.url"

                        >
                        <i @click="deleteAttachment" 
                            class="icon__18x18 icon-delete file-delete" 
                            :data-id="attachment.id"
                            :class="{ 'd-block': hoveredItemIds.has(attachment.id) }"
                        >
                        </i>
                    </div>
                    
                    <div class="image-desc">
                        <div class="value flex-wrap">{{formatName(attachment.file_name)}}</div>
                        <div class="image-date">{{formatDate(attachment.created_at)}}</div>
                    </div>
            </div>
        </div>
    </div>
    `
}


// <div class="attch-img"
// @click="openImage"
// :data-url="attachment.url"
// :style='"background-image: url(" + getDisplayFileUrl(attachment.thumbnail_url) + ")"'
// >
// <i @click="deleteAttachment" class="icon__18x18 icon-delete file-delete" :data-id="attachment.id"></i>
// </div>