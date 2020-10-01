import getCards from "https://bqardi.github.io/cards/api/card.js";

let cardsShuffled = document.querySelector(".cards__shuffled");
let cardsRevealed = document.querySelector(".cards__turned");

let fields = [];
let revealed = [];
let cardsObj;

document.querySelectorAll(".cards__field").forEach(element => {
    fields.push(createField(element));
});

cardsShuffled.addEventListener("click", function(event){
    if (event.target.classList.contains("cards__empty")) {
        cardsObj.inPlayToDeck();
        placeDeck(cardsObj);
        cardsRevealed.innerHTML = "";
    }
})

getCards(function(cards){
    cardsShuffled.innerHTML = "";
    cardsRevealed.innerHTML = "";
    cards.shuffleDeck();
    cardsObj = cards;
    placeDeck(cards);
    deal();
});

function placeDeck(cards){
    let deck = createCard(cards.back.blue.image);
    
    cardsShuffled.appendChild(deck);
    
    deck.addEventListener("click", function(){
        let card = drawCard(true).card;
        revealCard(card);
        cardsRevealed.appendChild(card);
        if (cards.deck.length === 0) {
            cardsShuffled.innerHTML = "";
        }
    });
    return deck;
}

function deal(){
    let columns = fields.filter(field => !field.isAces);
    let facedDown = 0;
    columns.forEach(field => {
        for (let i = 0; i < facedDown; i++) {
            let card = drawCard(false).card;
            placeCard(field, card);
            card.addEventListener("click", function(){
                revealCard(card);
            });
        }
        facedDown++;
        let card = drawCard(true).card;
        placeCard(field, card);
        revealCard(card);
    });
}

function revealCard(card){
    card.classList.add("js-revealed");
    card.draggable = true;
    card.addEventListener("dragstart", drag);
    card.addEventListener("dblclick", toAcePlace);
}

function toAcePlace(event){
    let card = event.currentTarget;
    if (card.dataset.locked === "true") {
        return;
    }
    let cardObj = cardsObj.findCard(card.id);
    let acesFields = fields.filter(field => field.isAces);
    for (let i = 0; i < acesFields.length; i++) {
        const acesField = acesFields[i];
        let lastCard = acesField.lastCard();
        if (lastCard) {
            let lastCardObj = cardsObj.findCard(lastCard.id);
            if (cardObj.suit === lastCardObj.suit && cardObj.value === lastCardObj.value + 1) {
                placeCard(acesField, card);
                return;
            }
        } else {
            if (cardObj.value == 1) {
                placeCard(acesField, card);
                return;
            }
        }
    }
}

function drawCard(faceUp){
    let drawn = cardsObj.draw();
    let card = createCard(drawn.image);
    if (faceUp) {
        revealCard(card);
    }
    card.id = drawn.id;
    revealed.push({drawn, card});
    return {drawn, card};
}

function createCard(imgSrc){
    let card = document.createElement("DIV");
    card.classList.add("card");
    card.dataset.locked = false;
    
    let cardContainer = document.createElement("DIV");
    cardContainer.classList.add("card__container");
    
    let img = document.createElement("IMG");
    img.src = imgSrc;
    img.classList.add("card__image");
    cardContainer.appendChild(img);

    let imgBack = document.createElement("IMG");
    imgBack.src = cardsObj.back.blue.image;
    imgBack.classList.add("card__imageBack");
    cardContainer.appendChild(imgBack);

    card.appendChild(cardContainer);

    return card;
}

function createField(element){
    element.addEventListener("dragover", function(event){
        event.preventDefault();
    });
    element.addEventListener("drop", drop);
    return {
        id: element.id,
        element,
        cards: [],
        isEmpty: true,
        isAces: element.classList.contains("cards__ace"),
        addCard(card){
            this.cards.push(card);
            this.updateLocked();
            card.removeAttribute("style");
            if (this.isEmpty) {
                card.classList.remove("js-abovecard");
                this.isEmpty = false;
            } else {
                card.classList.add("js-abovecard");
                if (this.element.classList.contains("cards__table")) {
                    card.style.top = `${this.cards.length * 3 - 3}vw`;
                }
            }
            this.element.appendChild(card);
        },
        removeFrom(card){
            let index = this.cards.indexOf(card);
            let removed = this.cards.splice(index);
            this.updateLocked();
            return removed;
        },
        lastCard(){
            return this.cards[this.cards.length - 1] || null;
        },
        updateLocked(){
            if (this.cards.length === 0) {
                this.isEmpty = true;
            } else {
                this.cards.forEach(this.lockCard);
            }
        },
        lockCard(card, index, array){
            card.dataset.locked = index !== array.length - 1;
        }
    }
}

function drag(event){
    event.dataTransfer.setData("text", event.currentTarget.id);
}

function drop(event){
    event.preventDefault();
    let field = fields.find(obj => obj.id === event.currentTarget.id);
    let data = event.dataTransfer.getData("text");
    let card = document.getElementById(data);
    placeCard(field, card);
}

function placeCard(field, card){
    if (!card) {
        return;
    }
    let lastCard = field.lastCard();
    let currentCardObj = cardsObj.findCard(card.id);
    let arrayOfCards = [];
    if (lastCard && lastCard.classList.contains("js-revealed")) {
        let cardInFieldObj = cardsObj.findCard(lastCard.id);
        if (field.isAces) {
            if (currentCardObj.suit !== cardInFieldObj.suit || currentCardObj.value !== cardInFieldObj.value + 1) {
                return;
            }
        } else {
            if (currentCardObj.color === cardInFieldObj.color || currentCardObj.value !== cardInFieldObj.value - 1) {
                return;
            }
        }
    } else {
        if (field.isAces) {
            if (currentCardObj.value !== 1) {
                return;
            }
        }
    }
    if (card.dataset.field) {
        let prevField = fields.find(obj => obj.id === card.dataset.field);
        arrayOfCards = prevField.removeFrom(card);
    } else {
        let foundCardObj = findCardInPlay(card.id);
        let index = revealed.indexOf(foundCardObj);
        cardsObj.discard(foundCardObj.drawn);
        revealed.splice(index, 1);
        arrayOfCards.push(card);
    }
    arrayOfCards.forEach(movedCard => {
        movedCard.setAttribute("data-field", field.id);
        field.addCard(movedCard);
    });
}

function findCardInPlay(id){
    return revealed.find(obj => obj.card.id === id);
}