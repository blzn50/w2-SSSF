'use strict';
const ul = document.querySelector('ul');
const catSort = document.querySelector('#categorySort');
const idSort = document.querySelector('#idSort');
let catData;

/* making asynchronous call to data */
fetch('data1.json').then((response) => {
    if (response.ok) {
        return response.text();
    }
    throw new Error('Cannot get data');
}).then((data) => {
    catData = JSON.parse(data);
}).then(() => {
    update();
});

const update = () => {
    for (let item of catData) {
        /* list item generation */
        const li = document.createElement('li');
        const h3 = document.createElement('h3');
        const p = document.createElement('p');
        const img = document.createElement('img');
        const img1 = document.createElement('img');
        const footer = document.createElement('div');
        const button = document.createElement('button');

        h3.textContent = item.title;
        img.src = item.thumbnail;
        img.className = 'img-fluid';
        p.textContent = item.details;

        button.textContent = 'View';
        footer.className = 'card-footer';
        footer.appendChild(button);

        /* list item filling */
        li.className = 'card';
        li.appendChild(img);
        li.appendChild(h3);
        li.appendChild(p);
        li.appendChild(footer);
        ul.appendChild(li);

        /* modal items generation */
        const mod = document.querySelector('.modal');
        const modCont = document.createElement('div');
        const modHead = document.createElement('div');
        const modBod = document.createElement('div');
        const modFoot = document.createElement('div');
        const span = document.createElement('span');
        const close = document.createElement('button');
        const h2 = document.createElement('h2');
        const map = document.createElement('div');
        const date = document.createElement('h4');

        modCont.className = 'modal-content';
        modHead.className = 'modal-header';
        modBod.className = 'modal-body';
        modFoot.className = 'modal-footer';
        span.className = 'close';
        span.textContent = 'x';
        h2.textContent = item.title;
        map.setAttribute('id', 'map');
        date.textContent = item.time;

        close.textContent = 'Close';

        const myMap = () => {
            const mapProp = {
                center: {lat: item.coordinates.lat, lng: item.coordinates.lng},
                zoom: 12,
            };
            const mapVal = new google.maps.Map(map, mapProp);
            const marker = new google.maps.Marker({
                position: mapProp.center,
                map: mapVal,
            });
        };

        /* modal item filled after button click */
        button.addEventListener('click', () => {
            mod.style.display = 'block';
            mod.appendChild(modCont);
            modCont.appendChild(modHead);
            modHead.appendChild(span);
            modHead.appendChild(h2);
            modHead.appendChild(date);
            modCont.appendChild(modBod);
            img1.src = item.image;
            img1.className = 'img-fluid1';
            modBod.appendChild(img1);
            modCont.appendChild(modFoot);
            modFoot.appendChild(close);
            myMap();
            modBod.appendChild(map);
        });

        /* modal clear by clicking 'x' */
        span.addEventListener('click', () => {
            mod.style.display = 'none';
            modCont.parentNode.removeChild(modCont);
        });

        /* modal clear by clicking close button */
        close.addEventListener('click', () => {
            mod.style.display = 'none';
            modCont.parentNode.removeChild(modCont);
        });

        /* modal clear by clicking anywhere on window */
        window.addEventListener('click', (e) => {
            if (e.target == mod) {
                mod.style.display = 'none';
                modCont.parentNode.removeChild(modCont);
            }
        });
    }
};

/* Sorting by category */
const mainSort = () => {
    catData.sort(categorySort);
    clear();
    update();
};

const categorySort = (a, b) => {
    return (a.category).localeCompare(b.category);
};

/* sorting by id */
const secSort = () => {
    catData.sort(sortById);
    clear();
    update();
};

// try map filter,...
const sortById = (a, b) => {
    if (a.id < b.id) {
        return -1;
    } else if (a.id > b.id) {
        return 1;
    } else {
        return 0;
    }
};

/* clear document */
const clear = () => {
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }
};

/* event listener for sorting */
catSort.addEventListener('click', mainSort, false);
idSort.addEventListener('click', secSort, false);
