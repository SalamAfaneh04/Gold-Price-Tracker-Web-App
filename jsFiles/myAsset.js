const selectImg = document.getElementById('selectImg');

 function selectImg(){
    const type = sessionStorage.getItem(active);
    if (type == 'f'){
        selectImg.src = '../images/female.png';
    }else{
        selectImg.src = '../images/male.png';
    }
}