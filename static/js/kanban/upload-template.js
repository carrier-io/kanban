let boardboardDropArea, boardboardPreviewArea;

$(document).ready(function() {
    boardDropArea = document.getElementById('boardDragboardDropArea');
    boardPreviewArea = document.getElementById('boardPreviewArea');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, preventDefaults, false)
    })

    ['dragenter', 'dragover'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, highlight, false)
    });

    ['dragleave', 'drop'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, unhighlight, false)
    })

    function highlight(e) {
        boardDropArea.classList.add('highlight')
    }
    function unhighlight(e) {
        boardDropArea.classList.remove('highlight')
    }
    boardDropArea.addEventListener('drop', handleDrop, false)
    function handleDrop(e) {
        let dt = e.dataTransfer
        let files = dt.files
        handleFiles(files)
    }
})

function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile)
}
function uploadFile(file) {
    const item = document.createElement('div');
    item.classList.add('preview-area_item', 'preview-area_loader');
    const fileName = document.createElement('span');
    fileName.innerText = file.name;
    item.append(fileName);
    boardPreviewArea.append(item);
    setTimeout(() => {
        item.classList.remove('preview-area_loader');
        item.classList.add('preview-area_close');
    }, 1000);
}