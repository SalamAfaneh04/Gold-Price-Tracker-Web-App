const selectImg = document.getElementById('profilePic');

function setProfileImage() {
    const profilePic = document.getElementById('profilePic');
    if (!profilePic){
        return;
    } 

    const gender = sessionStorage.getItem('active') || 'f';
    
    profilePic.src = gender === 'm'
        ? '../assets/images/male.png'
        : '../assets/images/female.png';
}

// 1. to select date avalable
document.addEventListener('DOMContentLoaded', () => {
    setProfileImage();

    const datePicker = document.getElementById('purchaseDate');
    const today = new Date().toISOString().split('T')[0];
    datePicker.setAttribute('max', today);
    datePicker.value = today;
});

// 2. Control the catogory input in add asset form
function toggleFormFields() {
    const selectedType = document.getElementById('typeSelect').value;
    const jewelryGroup = document.getElementById('jewelryOptions');
    const coinGroup = document.getElementById('coinOptions');

    jewelryGroup.classList.add('hidden-field');
    coinGroup.classList.add('hidden-field');

    if (selectedType === 'Jewelry') {
        jewelryGroup.classList.remove('hidden-field');
    } else if (selectedType === 'Coins') {
        coinGroup.classList.remove('hidden-field');
    }
}

// 3. to collect Pic with catogory

function getAssetImage(type, category) {
    const imageMap = {
        'Jewelry': {
            'Ring': '../assets/images/gold-jewelry.png',
            'Necklace': '../assets/images/necklace.png',
            'Watch': '../assets/images/watch.png',
        },
        'Coins': {
            'Rashadi': '../assets/coins/rashadi_coin.png',
            'English': '../assets/coins/english_coin.png',
        },
        'Bars': '../assets/bars/gold-bar.jpg'
    };

    if (type === 'Jewelry') {
        return imageMap.Jewelry[category] || '../assets/images/gold-jewelry.png';
    } else if (type === 'Coins') {
        return imageMap.Coins[category] || '../assets/coins/rashadi_coin.png';
    } else {
        return imageMap.Bars;
    }
}
