import React, { useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string>('');
  const [resetNext, setResetNext] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === '0' || resetNext) {
      setDisplay(digit);
      setResetNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleOperator = (op: string) => {
    setHistory(`${display} ${op}`);
    setResetNext(true);
  };

  const safeCalculate = (expression: string): number => {
    // Clean tokenized arithmetic parser
    const tokens = expression.match(/(\d+\.?\d*|[\+\-\*\/])/g);
    if (!tokens) return 0;

    let total = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const nextVal = parseFloat(tokens[i + 1]);
      if (isNaN(nextVal)) continue;

      if (op === '+') total += nextVal;
      else if (op === '-') total -= nextVal;
      else if (op === '*') total *= nextVal;
      else if (op === '/') total = nextVal !== 0 ? total / nextVal : 0;
    }
    return total;
  };

  const calculate = () => {
    if (!history) return;
    try {
      const expr = `${history} ${display}`
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      const result = safeCalculate(expr);
      setHistory(`${history} ${display} =`);
      setDisplay(String(Number(result.toFixed(6))));
      setResetNext(true);
    } catch {
      setDisplay('Error');
      setResetNext(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setHistory('');
    setResetNext(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const buttons = [
    { label: 'C', onClick: clear, type: 'action' },
    { label: '⌫', onClick: backspace, type: 'action' },
    { label: '%', onClick: () => setDisplay(String(Number(display) / 100)), type: 'action' },
    { label: '÷', onClick: () => handleOperator('÷'), type: 'op' },

    { label: '7', onClick: () => handleDigit('7'), type: 'num' },
    { label: '8', onClick: () => handleDigit('8'), type: 'num' },
    { label: '9', onClick: () => handleDigit('9'), type: 'num' },
    { label: '×', onClick: () => handleOperator('×'), type: 'op' },

    { label: '4', onClick: () => handleDigit('4'), type: 'num' },
    { label: '5', onClick: () => handleDigit('5'), type: 'num' },
    { label: '6', onClick: () => handleDigit('6'), type: 'num' },
    { label: '-', onClick: () => handleOperator('-'), type: 'op' },

    { label: '1', onClick: () => handleDigit('1'), type: 'num' },
    { label: '2', onClick: () => handleDigit('2'), type: 'num' },
    { label: '3', onClick: () => handleDigit('3'), type: 'num' },
    { label: '+', onClick: () => handleOperator('+'), type: 'op' },

    { label: '±', onClick: () => setDisplay(String(Number(display) * -1)), type: 'num' },
    { label: '0', onClick: () => handleDigit('0'), type: 'num' },
    { label: '.', onClick: () => !display.includes('.') && setDisplay(display + '.'), type: 'num' },
    { label: '=', onClick: calculate, type: 'equal' },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white p-4 select-none max-w-sm mx-auto justify-between">
      {/* Display Screen */}
      <div className="flex-1 flex flex-col justify-end items-end p-4 bg-neutral-950/60 rounded-3xl border border-neutral-800/80 mb-4">
        <span className="text-xs text-neutral-400 font-mono tracking-wider h-5">{history}</span>
        <span className="text-4xl font-light text-white font-mono tracking-tight mt-1 truncate max-w-full">
          {display}
        </span>
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-2.5">
        {buttons.map((btn, i) => {
          let bgClass = 'bg-neutral-800 hover:bg-neutral-700 text-white';
          if (btn.type === 'action') bgClass = 'bg-neutral-700 hover:bg-neutral-600 text-purple-300 font-semibold';
          if (btn.type === 'op') bgClass = 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 font-semibold text-lg';
          if (btn.type === 'equal') bgClass = 'bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg shadow-lg';

          return (
            <button
              key={i}
              onClick={btn.onClick}
              className={`h-14 rounded-2xl flex items-center justify-center text-base active:scale-95 transition-all font-medium ${bgClass}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
