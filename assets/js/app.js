import getCards from "https://bqardi.github.io/cards/api/card.js";
import splashScreen from "./modules/splash-screen.js";

let cardsShuffleContainer = document.querySelector(".cards__shuffled");
let cardsShuffled = cardsShuffleContainer.querySelector(".cards__container");
let deckFlipCounter = document.querySelector(".cards__counter");
let cardsRevealed = document.querySelector(".cards__turned");

const CARD_OFFSET = 2;

let fields = [];
let revealed = [];
let flippedCards = [];
let cardsObj;
let deckFlipCount = 1;

document.querySelectorAll(".cards__field").forEach(element => {
    fields.push(createField(element));
});

cardsShuffleContainer.addEventListener("click", function(event){
    if (event.target.classList.contains("cards__empty")) {
        flippedCards = [];
        deckFlipCount++;
        deckFlipCounter.textContent = deckFlipCount;
        cardsObj.inPlayToDeck();
        placeDeck(cardsObj);
        cardsRevealed.innerHTML = "";
    }
});

splashScreen();

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
        let cardFlipCount = Math.min(3, cards.deck.length);
        for (let i = 0; i < cardFlipCount; i++) {
            let card = drawCard(true).card;
            flippedCards.push(card);
            card.style.left = `${i * CARD_OFFSET}vw`;
            card.style.right = `${i * -CARD_OFFSET}vw`;
            cardsRevealed.appendChild(card);
        }
        updateFlippedCards();
        if (cards.deck.length === 0) {
            cardsShuffled.innerHTML = "";
        }
    });

    return deck;
}

function updateFlippedCards(){
    if (flippedCards.length === 0) {
        return;
    }
    for (let i = 0; i < flippedCards.length; i++) {
        const flippedCard = flippedCards[i];
        if (i === flippedCards.length - 1) {
            flippedCard.dataset.sealed = "false";
        } else {
            flippedCard.dataset.sealed = "true";
        }
    }
}

function deal(){
    let columns = fields.filter(field => !field.isAces);
    let facedDown = 0;
    columns.forEach(field => {
        for (let i = 0; i < facedDown; i++) {
            let card = drawCard(false).card;
            placeCard(field, card, true);
            card.addEventListener("click", function(){
                if (card.dataset.locked === "true") {
                    return;
                }
                revealCard(card);
            });
        }
        facedDown++;
        let card = drawCard(true).card;
        placeCard(field, card, true);
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
                    card.style.top = `${this.cards.length * CARD_OFFSET - CARD_OFFSET}vw`;
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
    if (event.currentTarget.dataset.sealed === "true") {
        return;
    }
    event.dataTransfer.setData("text", event.currentTarget.id);
}

function drop(event){
    event.preventDefault();
    let field = fields.find(obj => obj.id === event.currentTarget.id);
    let data = event.dataTransfer.getData("text");
    let card = document.getElementById(data);
    placeCard(field, card);
}

function placeCard(field, card, dealing = false){
    if (!card) {
        return;
    }
    let lastCardInField = field.lastCard();
    let currentCardObj = cardsObj.findCard(card.id);
    let arrayOfCards = [];
    if (lastCardInField) {
        if (lastCardInField.classList.contains("js-revealed")) {
            let cardInFieldObj = cardsObj.findCard(lastCardInField.id);
            if (field.isAces) {
                if (currentCardObj.suit !== cardInFieldObj.suit || currentCardObj.value !== cardInFieldObj.value + 1) {
                    return;
                }
            } else {
                if (currentCardObj.color === cardInFieldObj.color || currentCardObj.value !== cardInFieldObj.value - 1) {
                    return;
                }
            }
        }
    } else {
        if (field.isAces) {
            if (currentCardObj.value !== 1) {
                return;
            }
        } else {
            if (!dealing && currentCardObj.value !== 13) {
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
        flippedCards.splice(-1);
        updateFlippedCards();
    }
    arrayOfCards.forEach(movedCard => {
        movedCard.setAttribute("data-field", field.id);
        field.addCard(movedCard);
    });
}

function findCardInPlay(id){
    return revealed.find(obj => obj.card.id === id);
}