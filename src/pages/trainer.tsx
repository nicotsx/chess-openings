import { useState } from 'react';

export const Trainer = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Trainer</h1>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};
