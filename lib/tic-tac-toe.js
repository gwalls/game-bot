'use strict';

const config = require('config')
    , _ = require('lodash');

let events = ['direct_message', 'direct_mention', 'mention']
  , ticTacToePattern = '^tic-tac-toe$'
  , board = _.fill(Array(3), _.fill(Array(3), ' '))  //[[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']]
  , playerShape
  , botShape;

function heard(bot, message) {
  bot.startConversation(message, askStart);
}

module.exports = {
  init: function(controller) {
    // email first since the username pattern will match emails as well
    controller.hears(ticTacToePattern, events, heard);
  },
  help: {
    command: 'tic-tac-toe',
    text: (options) => {
      return `Usage: \`@${options.botName} tic-tac-toe\``;
    }
  }
};

function askStart(err, convo) {
  convo.ask(`What shape would you like to be?`, [
    {
      pattern: '[x,X,o,O]',
      callback: function (response, convo) {
        playerShape = _.toUpper(response.text);
        botShape = _.difference(['X', 'O'], [playerShape])[0];

        convo.say(`Okay! You be ${playerShape}'s and I'll be ${botShape}'s!`);
        askNext(err, convo);
        convo.next();
      }
    },
    {
      default: true,
      callback: function(response, convo) {
        convo.say('Please choose `X` or `O`!');
        // just repeat the question
        convo.repeat();
        convo.next();
      }
    }
  ]);
}

function askNext(err, convo) {
  convo.ask(`Where's your next move, playa?`, [
    {
      pattern: '[0-2],[0-2]',
      callback: function (response, convo) {
        let coord = response.text.split(',');

        if (validMove(coord)) {
          convo.say(selectPos(coord));
        } else {
          convo.say(`Excuse me, you can't put your ${playerShape} there!`);
          convo.repeat();
          convo.next();
        }

        if (determineWin(playerShape)) {
          convo.say('You win! Congrats!');
        } else if (determineWin(botShape)) {
          convo.say('I win. Try again next time!');
        } else if (determineDraw()) {
          convo.say('We tied!');
        } else {
          askNext(err, convo);
        }
        convo.next();
      }
    },
    {
      default: true,
      callback: function(response, convo) {
        convo.say('Let me be clear - you must enter a coordinate like `0,2`');
        // just repeat the question
        convo.repeat();
        convo.next();
      }
    }
  ]);
}

function selectPos(pos) {
  let posX = pos[0]
    , posY = pos[1]
    , selected = false
    , debugTries = 0;

  board[posX][posY] = playerShape;

  // bot makes a move
  while (! selected) {
    console.log(debugTries++);

    posX = _.random(2);
    posY = _.random(2);

    if (validMove(['0','0'])) {
      board[posX][posY] = botShape;
      selected = true;
    }

    if (debugTries > 10000) {
      console.log('We should have found an open space by now; bailing out');
      selected = true;
    }
  }

  return formatBoard();
}

/**
 * Formats the tic-tac-toe board with pretty lines
 *
 * @returns {string}
 */
function formatBoard() {
  return `\`\`\`
 ${board[0][0]} | ${board[0][1]} | ${board[0][2]}
---|---|---
 ${board[1][0]} | ${board[1][1]} | ${board[1][2]}
---|---|---
 ${board[2][0]} | ${board[2][1]} | ${board[2][2]}
\`\`\``;
}

/**
 * Determines if player has won
 *
 * @param {string} shape The shape to check for a win
 * @returns {boolean}
 */
function determineWin(shape) {
  let win = false
    , scenarios = [
      [[0,0], [0,1], [0,2]],
      [[1,0], [1,1], [1,2]],
      [[2,0], [2,1], [2,2]],
      [[0,0], [1,1], [2,2]],
      [[0,2], [1,1], [2,0]]
    ];

  _.forEach(scenarios, (pattern) => {
    win = true; // win pattern until proven otherwise
    _.forEach(pattern, (pos) => {
      if (board[pos[0]][pos[1]] !== shape) {
        win = false;
      }
    });
    if (win) {
      console.log(`Won with ${pattern}`);
      return win;
    };
  });

  return win; // should be false at this point
}

/**
 * Checks for existing shape before placing a new shape on the board
 *
 * @param {array} pos Coordinates of proposed move
 * @returns {boolean}
 */
function validMove(pos) {
  if (board[pos[0]][pos[1]] === ' ') { return true };
}

/**
 * Determines whether all spaces have been used up on the board
 *
 * @returns {boolean}
 */
function determineDraw() {
  if (_.without(board, 'X', 'O').length === 0) { return true };
}

// [[x, o, x], [o, x, o], [x, o, x]]
//  x | o | x
// ---|---|---
//  o | x | o
// ---|---|---
//  x | o | x
