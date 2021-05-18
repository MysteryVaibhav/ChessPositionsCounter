var board = null
var game = new Chess()
var numMoves = 0
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $board = $('#myBoard')
var squareClass = 'square-55d63'
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
var currPiece = null
var currMove = null
var autoOrientation = false
var isHighlight = true
var isActive = false
var graph = false

function resetBoard () {
  var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
  }
  board = Chessboard('myBoard', config)
  game = new Chess()
  dicesToMove = []
  currPiece = null
  currMove = null
  numMoves = 0
  updateStatus()
}

function flip () {
  board.flip()
}

function orientate () {
  if (autoOrientation) {
    document.getElementById('autoOrientation').innerHTML = "Auto Orientation is Off"
    autoOrientation = false;
  } else {
    document.getElementById('autoOrientation').innerHTML = "Auto Orientation is On"
    autoOrientation = true;
  }
}

function toHighlight () {
  if (isHighlight) {
    document.getElementById('highlights').innerHTML = "Highlights are Off"
    $board.find('.' + squareClass).removeClass('highlight-black')
    $board.find('.' + squareClass).removeClass('highlight-white')
    isHighlight = false;
  } else {
    document.getElementById('highlights').innerHTML = "Highlights are On"
    isHighlight = true;
  }
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
  currPiece = piece;
}

function onDrop (source, target) {
  var currTurn = game.turn();
  // see if the move is legal
  move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'
  if (!(currTurn + dicesToMove[0] === currPiece || currTurn + dicesToMove[1] === currPiece || currTurn + dicesToMove[2] === currPiece)) {
    game.undo();
    return 'snapback';
  }
  currMove = move;
  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onMouseoverSquare (square, piece) {
  if (isHighlight) {
    // get list of possible moves for this square
    var moves = game.moves({
      square: square,
      verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the square they moused over
    if (game.turn() + dicesToMove[0] == piece || game.turn() + dicesToMove[1] == piece || game.turn() + dicesToMove[2] == piece) {
      greySquare(square)
    }

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].piece.toUpperCase() === dicesToMove[0] || moves[i].piece.toUpperCase() === dicesToMove[1] || moves[i].piece.toUpperCase() === dicesToMove[2]) {
        greySquare(moves[i].to)
      }

    }
  }
}

function onMouseoutSquare (square, piece) {
  if (isHighlight) {
    removeGreySquares()
  }
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }

    // Highlight last move
    if (isHighlight) {
      if (currMove !== null && currMove.color === 'w') {
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.square-' + currMove.from).addClass('highlight-white')
        $board.find('.square-' + currMove.to)
          .addClass('highlight-' + 'white')
      } else if (currMove !== null && currMove.color === 'b') {
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + currMove.from).addClass('highlight-black')
        $board.find('.square-' + currMove.to)
          .addClass('highlight-' + 'black')
      }
    }

    if (game.turn() === 'b') {
      if (autoOrientation) {
        board.orientation('black')
      }
    } else {
      if (autoOrientation) {
        board.orientation('white')
      }
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
}

resetBoard()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var treeData = [
  {
    "name": "Depth 0",
    "parent": "null"
  }
];

function shuffle(arr) {
  return arr
          .map((a) => ({sort: Math.random(), value: a}))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value)
}

async function makeRandomMoves (depth, ms) {
  var possibleMoves = game.moves();
  possibleMoves = shuffle(possibleMoves);
  if (!game.game_over()) {
    for (var i = 0; i < possibleMoves.length; i++) {
      game.move(possibleMoves[i]);
      numMoves += 1;
      document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 1;
      board.position(game.fen());
      $fen.html(game.fen())
      $pgn.html(game.pgn())
      if (graph) {
        if (!treeData[0].hasOwnProperty("children")) {
          treeData[0]["children"] = [];
        }
        treeData[0].children.push({
          "name": "1: " + possibleMoves[i],
          "parent": "Depth 0"
        });
        update(treeData[0]);
      }
      await sleep(ms);

      if (depth > 1) {
        // Explore black moves
        var possibleBlackMoves = game.moves();
        possibleBlackMoves = shuffle(possibleBlackMoves);
        if (!game.game_over()) {
          for (var j = 0; j < possibleBlackMoves.length; j++) {
            game.move(possibleBlackMoves[j]);
            numMoves += 1;
            document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 2;
            board.position(game.fen());
            $fen.html(game.fen())
            $pgn.html(game.pgn())
            if (graph) {
              if (!treeData[0].children[i].hasOwnProperty("children")) {
                treeData[0].children[i]["children"] = [];
              }
              treeData[0].children[i].children.push({
                "name": "2: " + possibleBlackMoves[j],
                "parent": "1"
              });
              update(treeData[0]);
            }
            await sleep(ms);

            if (depth > 2) {
              // Explore black moves
              var possibleMoves1 = game.moves();
              possibleMoves1 = shuffle(possibleMoves1);
              if (!game.game_over()) {
                for (var k = 0; k < possibleMoves1.length; k++) {
                  game.move(possibleMoves1[k]);
                  numMoves += 1;
                  document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 3;
                  board.position(game.fen());
                  $fen.html(game.fen())
                  $pgn.html(game.pgn())
                  if (graph) {
                    if (!treeData[0].children[i].children[j].hasOwnProperty("children")) {
                      treeData[0].children[i].children[j]["children"] = [];
                    }
                    treeData[0].children[i].children[j].children.push({
                      "name": "3: " + possibleMoves1[k],
                      "parent": "2"
                    });
                    update(treeData[0]);
                  }
                  await sleep(ms);

                  if (depth > 3) {
                    // Explore black moves
                    var possibleMoves2 = game.moves();
                    possibleMoves2 = shuffle(possibleMoves2);
                    if (!game.game_over()) {
                      for (var l = 0; l < possibleMoves2.length; l++) {
                        game.move(possibleMoves2[l]);
                        numMoves += 1;
                        document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 4;
                        board.position(game.fen());
                        $fen.html(game.fen())
                        $pgn.html(game.pgn())
                        if (graph) {
                          if (!treeData[0].children[i].children[j].children[k].hasOwnProperty("children")) {
                            treeData[0].children[i].children[j].children[k]["children"] = [];
                          }
                          treeData[0].children[i].children[j].children[k].children.push({
                            "name": "4: " + possibleMoves2[l],
                            "parent": "3"
                          });
                          update(treeData[0]);
                        }
                        await sleep(ms);

                        if (depth > 4) {
                          // Explore black moves
                          var possibleMoves3 = game.moves();
                          possibleMoves3 = shuffle(possibleMoves3);
                          if (!game.game_over()) {
                            for (var m = 0; m < possibleMoves3.length; m++) {
                              game.move(possibleMoves1[m]);
                              numMoves += 1;
                              document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 5;
                              board.position(game.fen());
                              $fen.html(game.fen())
                              $pgn.html(game.pgn())
                              if (graph) {
                                if (!treeData[0].children[i].children[j].children[k].children[l].hasOwnProperty("children")) {
                                  treeData[0].children[i].children[j].children[k].children[l]["children"] = [];
                                }
                                treeData[0].children[i].children[j].children[k].children[l].children.push({
                                  "name": "5: " + possibleMoves3[m],
                                  "parent": "4"
                                });
                                update(treeData[0]);
                              }
                              await sleep(ms);

                              if (depth > 5) {
                                // Explore black moves
                                var possibleMoves4 = game.moves();
                                possibleMoves4 = shuffle(possibleMoves4);
                                if (!game.game_over()) {
                                  for (var n = 0; n < possibleMoves4.length;n++) {
                                    game.move(possibleMoves4[n]);
                                    numMoves += 1;
                                    document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 6;
                                    board.position(game.fen());
                                    $fen.html(game.fen())
                                    $pgn.html(game.pgn())
                                    if (graph) {
                                      if (!treeData[0].children[i].children[j].children[k].children[l].children[m].hasOwnProperty("children")) {
                                        treeData[0].children[i].children[j].children[k].children[l].children[m]["children"] = [];
                                      }
                                      treeData[0].children[i].children[j].children[k].children[l].children[m].children.push({
                                        "name": "6: " + possibleMoves4[n],
                                        "parent": "5"
                                      });
                                      update(treeData[0]);
                                    }
                                    await sleep(ms);

                                    if (depth > 6) {
                                      // Explore black moves
                                      var possibleMoves5 = game.moves();
                                      possibleMoves5 = shuffle(possibleMoves5);
                                      if (!game.game_over()) {
                                        for (var o = 0; o < possibleMoves5.length; o++) {
                                          game.move(possibleMoves5[o]);
                                          numMoves += 1;
                                          document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 7;
                                          board.position(game.fen());
                                          $fen.html(game.fen())
                                          $pgn.html(game.pgn())
                                          await sleep(ms);

                                          if (depth > 7) {
                                            // Explore black moves
                                            var possibleMoves6 = game.moves();
                                            possibleMoves6 = shuffle(possibleMoves6);
                                            if (!game.game_over()) {
                                              for (var p = 0; p < possibleMoves6.length; p++) {
                                                game.move(possibleMoves6[p]);
                                                numMoves += 1;
                                                document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 8;
                                                board.position(game.fen());
                                                $fen.html(game.fen())
                                                $pgn.html(game.pgn())
                                                await sleep(ms);

                                                if (depth > 8) {
                                                  // Explore black moves
                                                  var possibleMoves7 = game.moves();
                                                  possibleMoves7 = shuffle(possibleMoves7);
                                                  if (!game.game_over()) {
                                                    for (var q = 0; q < possibleMoves7.length; q++) {
                                                      game.move(possibleMoves7[q]);
                                                      numMoves += 1;
                                                      document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 9;
                                                      board.position(game.fen());
                                                      $fen.html(game.fen())
                                                      $pgn.html(game.pgn())
                                                      await sleep(ms);

                                                      if (depth > 9) {
                                                        // Explore black moves
                                                        var possibleMoves8 = game.moves();
                                                        possibleMoves8 = shuffle(possibleMoves8);
                                                        if (!game.game_over()) {
                                                          for (var r = 0; r < possibleMoves8.length;r++) {
                                                            game.move(possibleMoves8[r]);
                                                            numMoves += 1;
                                                            document.getElementById('dice').innerHTML = "# Positions: " + numMoves + "<br> Current Depth: " + 10;
                                                            board.position(game.fen());
                                                            $fen.html(game.fen())
                                                            $pgn.html(game.pgn())
                                                            await sleep(ms);
                                                            game.undo();
                                                          }
                                                        }
                                                      }

                                                      game.undo();
                                                    }
                                                  }
                                                }

                                                game.undo();
                                              }
                                            }
                                          }

                                          game.undo();
                                        }
                                      }
                                    }

                                    game.undo();
                                  }
                                }
                              }

                              game.undo();
                            }
                          }
                        }

                        game.undo();
                      }
                    }
                  }

                  game.undo();
                }
              }
            }

            game.undo();
          }
        }
      }

      game.undo();

    }
  }
}

function startMakingMoves() {
  if (isActive) {
    window.location.reload(true);
  } else {
    var ms = parseInt(document.getElementById("timeDelay").value);
    var depth = parseInt(document.getElementById('depth').value);

    if (isNaN(ms)) {
      alert("Enter a valid time delay");
    } else if (isNaN(depth)) {
      alert("Enter a valid depth");
    } else if (depth < 1 || depth > 10) {
      alert("Enter a depth between 1-10");
    } else {
      isActive = true;
      document.getElementById('startPositionBtn').innerHTML = "Click to Refresh"
      makeRandomMoves(depth, ms)
    }
  }
}

function turnOnGraph() {
  var x = document.getElementById("graph");
  if (x.style.display === "none") {
    x.style.display = "block";
    graph = true
    document.getElementById('flipOrientationBtn').innerHTML = "Turn Off Exploration Graph"
  } else {
    graph = false
    x.style.display = "none";
    document.getElementById('flipOrientationBtn').innerHTML = "Turn On Exploration Graph"
  }
}

// ************** Generate the tree diagram	 *****************
var margin = {top: 0, right: 10, bottom: 20, left: 20},
  width = 960 - margin.right - margin.left,
  height = 500 - margin.top - margin.bottom;

var i = 0,
  duration = 750,
  root;

var tree = d3.layout.tree()
  .size([height, width]);

var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#graph").append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = treeData[0];
root.x0 = height / 2;
root.y0 = 0;

update(root);

d3.select(self.frameElement).style("height", "500px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    .on("click", click);

  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
    .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
    .remove();

  nodeExit.select("circle")
    .attr("r", 1e-6);

  nodeExit.select("text")
    .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
    .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
    var o = {x: source.x0, y: source.y0};
    return diagonal({source: o, target: o});
    });

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
    var o = {x: source.x, y: source.y};
    return diagonal({source: o, target: o});
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
  d.x0 = d.x;
  d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
  d._children = d.children;
  d.children = null;
  } else {
  d.children = d._children;
  d._children = null;
  }
  update(d);
}

$('#startPositionBtn').on('click', startMakingMoves)
$('#flipOrientationBtn').on('click', turnOnGraph)
