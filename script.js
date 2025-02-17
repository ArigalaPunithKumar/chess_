let initialBoard = [
    'rnbqkbnr',
    'pppppppp',
    '........',
    '........',
    '........',
    '........',
    'PPPPPPPP',
    'RNBQKBNR'
  ];

  const pieces = {
    r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟', // Black pieces
    R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙'  // White pieces
  };

  let moveHistory = [];
  let collectedPieces = { 'r': 0, 'n': 0, 'b': 0, 'q': 0, 'k': 0, 'p': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0, 'K': 0, 'P': 0 };
  let currentPlayer = 'white'; // 'white' or 'black'
  let selectedPiece = null;

  function renderBoard(boardState) {
    const chessBoard = document.getElementById('chessBoard');
    chessBoard.innerHTML = ''; // Clear previous board

    boardState.forEach((row, rowIndex) => {
      row.split('').forEach((piece, colIndex) => {
        const square = document.createElement('div');
        square.className = (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black';
        square.dataset.row = rowIndex;
        square.dataset.col = colIndex;
        if (piece !== '.') {
          square.innerHTML = `<div class="chess-piece">${pieces[piece]}</div>`;
        }
        chessBoard.appendChild(square);
      });
    });

    chessBoard.querySelectorAll('.chess-board div').forEach(square => {
      square.addEventListener('click', handleSquareClick);
    });
  }

  renderBoard(initialBoard);

  function handleSquareClick(event) {
    const clickedSquare = event.currentTarget;
    const row = parseInt(clickedSquare.dataset.row);
    const col = parseInt(clickedSquare.dataset.col);
    const piece = initialBoard[row][col];

    if (!selectedPiece && piece !== '.' && isCurrentPlayerPiece(piece)) {
      selectedPiece = { row, col, piece };
      clickedSquare.classList.add('selected');
      showValidMoves(row, col, piece);
    } else if (selectedPiece) {
      const isValidMove = attemptMove(selectedPiece.row, selectedPiece.col, row, col, selectedPiece.piece);
      if (isValidMove) {
        moveHistory.push({ fromRow: selectedPiece.row, fromCol: selectedPiece.col, toRow: row, toCol: col, piece: selectedPiece.piece, captured: piece });
        initialBoard[row] = initialBoard[row].substring(0, col) + selectedPiece.piece + initialBoard[row].substring(col + 1);
        initialBoard[selectedPiece.row] = initialBoard[selectedPiece.row].substring(0, selectedPiece.col) + '.' + initialBoard[selectedPiece.row].substring(selectedPiece.col + 1);

        if (piece !== '.') {
          collectedPieces[piece] += 1;
        }

        playMoveSound();
        renderBoard(initialBoard);
        clearValidMoves();

        // Check for check or checkmate
        if (isInCheck(initialBoard, currentPlayer === 'white' ? 'k' : 'K')) {
          if (isCheckmate(initialBoard, currentPlayer === 'white' ? 'k' : 'K')) {
            document.getElementById('winnerMessage').innerText = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins by checkmate!`;

            disableBoard();
            return;
          } else {
            alert('Check!');
          }
        }
        selectedPiece = null;
        switchPlayer();
      } else {
        selectedPiece = null;
        renderBoard(initialBoard);
        clearValidMoves();
      }
    }
  }
  function openPromotionModal() {
    document.getElementById('promotionModal').style.display = 'block';
  }

  function closePromotionModal() {
    document.getElementById('promotionModal').style.display = 'none';
  }

  function promotePawn(piece) {
    if (promotionPawn) {
      const { row, col } = promotionPawn;
      initialBoard[row] = initialBoard[row].substring(0, col) + (currentPlayer === 'white' ? piece.toUpperCase() : piece.toLowerCase()) + initialBoard[row].substring(col + 1);
      promotionPawn = null;
      closePromotionModal();
      finalizeMove();
      renderBoard(initialBoard);
      clearValidMoves();
      switchPlayer();
    }
  }
  function finalizeMove() {
    if (selectedPiece && selectedPiece.piece.toLowerCase() === 'k') {
      if (Math.abs(selectedPiece.col - promotionPawn.col) === 2) {
        // Handle castling
        if (selectedPiece.col < promotionPawn.col) {
          // King-side castling
          initialBoard[selectedPiece.row] = initialBoard[selectedPiece.row].substring(0, 7) + '.' + initialBoard[selectedPiece.row].substring(8);
          initialBoard[selectedPiece.row] = initialBoard[selectedPiece.row].substring(0, 5) + (currentPlayer === 'white' ? 'R' : 'r') + initialBoard[selectedPiece.row].substring(6);
        } else {
          // Queen-side castling
          initialBoard[selectedPiece.row] = initialBoard[selectedPiece.row].substring(0, 0) + '.' + initialBoard[selectedPiece.row].substring(1);
          initialBoard[selectedPiece.row] = initialBoard[selectedPiece.row].substring(0, 3) + (currentPlayer === 'white' ? 'R' : 'r') + initialBoard[selectedPiece.row].substring(4);
        }
      }
    }
  }

  function showValidMoves(fromRow, fromCol, piece) {
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (attemptMove(fromRow, fromCol, toRow, toCol, piece)) {
          const square = document.querySelector(`.chess-board div[data-row='${toRow}'][data-col='${toCol}']`);
          if (square) {
            square.classList.add('valid-move');
          }
        }
      }
    }
  }

  function clearValidMoves() {
    const chessBoard = document.getElementById('chessBoard');
    chessBoard.querySelectorAll('.chess-board div').forEach(square => {
      square.classList.remove('valid-move');
    });
  }

  function isOpponentPiece(piece1, piece2) {
    return (piece1.toUpperCase() === piece1 && piece2.toLowerCase() === piece2) ||
           (piece1.toLowerCase() === piece1 && piece2.toUpperCase() === piece2);
  }

  function isCurrentPlayerPiece(piece) {
    return (currentPlayer === 'white' && piece.toUpperCase() === piece) || (currentPlayer === 'black' && piece.toLowerCase() === piece);
  }
  function attemptMove(fromRow, fromCol, toRow, toCol, piece) {
    const targetPiece = initialBoard[toRow][toCol];
    if (targetPiece !== '.' && !isOpponentPiece(piece, targetPiece)) {
      return false;
    }

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    let valid = false;
    switch (piece.toLowerCase()) {
      case 'p':
        const direction = piece === 'p' ? 1 : -1;
        if (colDiff === 0 && initialBoard[toRow][toCol] === '.' && (rowDiff === direction || (rowDiff === 2 * direction && (fromRow === 1 || fromRow === 6) && initialBoard[fromRow + direction][fromCol] === '.'))) {
          valid

 = true;
        } else if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece !== '.' && isOpponentPiece(piece, targetPiece)) {
          valid = true;
        }
        break;
      case 'r':
        valid = (rowDiff === 0 || colDiff === 0) && checkPath(fromRow, fromCol, toRow, toCol);
        break;
      case 'n':
        valid = Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1 || Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2;
        break;
      case 'b':
        valid = Math.abs(rowDiff) === Math.abs(colDiff) && checkPath(fromRow, fromCol, toRow, toCol);
        break;
      case 'q':
        valid = (Math.abs(rowDiff) === Math.abs(colDiff) || rowDiff === 0 || colDiff === 0) && checkPath(fromRow, fromCol, toRow, toCol);
        break;
      case 'k':
        valid = Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        break;
    }

    if (valid) {
      const boardCopy = JSON.parse(JSON.stringify(initialBoard));
      boardCopy[toRow] = boardCopy[toRow].substring(0, toCol) + piece + boardCopy[toRow].substring(toCol + 1);
      boardCopy[fromRow] = boardCopy[fromRow].substring(0, fromCol) + '.' + boardCopy[fromRow].substring(fromCol + 1);

      if (isInCheck(boardCopy, currentPlayer === 'white' ? 'K' : 'k')) {
        return false;
      }
    }

    return valid;
  }

  function checkPath(fromRow, fromCol, toRow, toCol) {
    const rowStep = fromRow < toRow ? 1 : fromRow > toRow ? -1 : 0;
    const colStep = fromCol < toCol ? 1 : fromCol > toCol ? -1 : 0;
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (initialBoard[currentRow][currentCol] !== '.') {
        return false;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }

    return true;
  }

  function undoMove() {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    initialBoard[lastMove.fromRow] = initialBoard[lastMove.fromRow].substring(0, lastMove.fromCol) + lastMove.piece + initialBoard[lastMove.fromRow].substring(lastMove.fromCol + 1);
    initialBoard[lastMove.toRow] = initialBoard[lastMove.toRow].substring(0, lastMove.toCol) + (lastMove.captured || '.') + initialBoard[lastMove.toRow].substring(lastMove.toCol + 1);

    if (lastMove.captured) {
      collectedPieces[lastMove.captured] -= 1;
    }

    renderBoard(initialBoard);
    clearValidMoves();
    selectedPiece = null;
    switchPlayer();
  }

  function resetBoard() {
    initialBoard = [
      'rnbqkbnr',
      'pppppppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'RNBQKBNR'
    ];
    moveHistory = [];
    collectedPieces = { 'r': 0, 'n': 0, 'b': 0, 'q': 0, 'k': 0, 'p': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0, 'K': 0, 'P': 0 };
    currentPlayer = 'white';
    selectedPiece = null;
    renderBoard(initialBoard);
    document.getElementById('winnerMessage').innerText = '';
  }

  function showCollectedPieces() {
    const collectedPiecesContainer = document.getElementById('collectedPieces');
    collectedPiecesContainer.innerHTML = '';

    for (const [piece, count] of Object.entries(collectedPieces)) {
      if (count > 0) {
        const pieceElement = document.createElement('div');
        pieceElement.innerText = `${pieces[piece]}: ${count}`;
        collectedPiecesContainer.appendChild(pieceElement);
      }
    }
  }

  function playMoveSound() {
    const moveSound = document.getElementById('moveSound');
    moveSound.play();
  }

  function isInCheck(board, king) {
    const kingPos = findPiece(board, king);
    const opponentPieces = king === 'k' ? 'RNBQKP' : 'rnbqkp';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (opponentPieces.includes(board[row][col])) {
          if (attemptMove(row, col, kingPos.row, kingPos.col, board[row][col])) {
            return true;
          }
        }
      }
    }

    return false;
  }

  function findPiece(board, piece) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === piece) {
          return { row, col };
        }
      }
    }
  }

  function isCheckmate(board, king) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if ((king === 'k' && piece === piece.toLowerCase()) || (king === 'K' && piece === piece.toUpperCase())) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (attemptMove(row, col, toRow, toCol, piece)) {
                const boardCopy = JSON.parse(JSON.stringify(board));
                boardCopy[toRow] = boardCopy[toRow].substring(0, toCol) + piece + boardCopy[toRow].substring(toCol + 1);
                boardCopy[row] = boardCopy[row].substring(0, col) + '.' + boardCopy[row].substring(col + 1);

                if (!isInCheck(boardCopy, king)) {
                  return false;
                }
              }
            }
          }
        }
      }
    }

    return true;
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
  }

  function disableBoard() {
    const chessBoard = document.getElementById('chessBoard');
    chessBoard.querySelectorAll('.chess-board div').forEach(square => {
      square.removeEventListener('click', handleSquareClick);
    });
  }