/**
 * SUMO TOURNAMENT V2 - Wrestler Data
 * Real sumo wrestlers with their characteristics
 */

const WRESTLERS = [
    {
        id: 1,
        name: 'Hoshoryu',
        rank: 'Ozeki',
        style: 'technical',
        signatureMove: 'uwatenage',
        image: 'images/Hoshoryu.jpg'
    },
    {
        id: 2,
        name: 'Kirishima',
        rank: 'Ozeki',
        style: 'technical',
        signatureMove: 'yorikiri',
        image: 'images/Kirishima.jpg'
    },
    {
        id: 3,
        name: 'Onosato',
        rank: 'Sekiwake',
        style: 'power',
        signatureMove: 'oshidashi',
        image: 'images/Onosato.jpg'
    },
    {
        id: 4,
        name: 'Wakamotoharu',
        rank: 'Komusubi',
        style: 'technical',
        signatureMove: 'yorikiri',
        image: 'images/Wakamotoharu.jpg'
    },
    {
        id: 5,
        name: 'Tamawashi',
        rank: 'Maegashira',
        style: 'power',
        signatureMove: 'oshidashi',
        image: 'images/Tamawashi.jpg'
    },
    {
        id: 6,
        name: 'Ura',
        rank: 'Maegashira',
        style: 'speed',
        signatureMove: 'hatakikomi',
        image: 'images/Ura.jpg'
    },
    {
        id: 7,
        name: 'Yoshinofuji',
        rank: 'Maegashira',
        style: 'technical',
        signatureMove: 'yorikiri',
        image: 'images/Yoshinofuji.jpg'
    },
    {
        id: 8,
        name: 'Aonishiki',
        rank: 'Maegashira',
        style: 'power',
        signatureMove: 'yorikiri',
        image: 'images/Aonishiki.jpg'
    },
    {
        id: 9,
        name: 'Ichiyamamoto',
        rank: 'Maegashira',
        style: 'speed',
        signatureMove: 'oshidashi',
        image: 'images/Ichiyamamoto.jpg'
    },
    {
        id: 10,
        name: 'Kotozakura',
        rank: 'Maegashira',
        style: 'power',
        signatureMove: 'yorikiri',
        image: 'images/Kotozakura.jpg'
    },
    {
        id: 11,
        name: 'Oho',
        rank: 'Maegashira',
        style: 'power',
        signatureMove: 'oshidashi',
        image: 'images/Oho.jpg'
    },
    {
        id: 12,
        name: 'Shodai',
        rank: 'Maegashira',
        style: 'technical',
        signatureMove: 'yorikiri',
        image: 'images/Shodai.jpg'
    }
];

const SIGNATURE_MOVES = ['yorikiri', 'oshidashi', 'uwatenage', 'hatakikomi'];

module.exports = {
    WRESTLERS,
    SIGNATURE_MOVES
};
