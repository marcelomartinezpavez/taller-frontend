import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { TextField } from '@mui/material';

function UCTextField({ onChange, inputRef: externalInputRef, ...props }) {
  const internalRef = useRef(null);
  const savedCursor = useRef(null);

  // Merge our internal ref with any inputRef passed from outside (e.g. Autocomplete params)
  const mergedInputRef = useCallback((el) => {
    internalRef.current = el;
    if (typeof externalInputRef === 'function') externalInputRef(el);
    else if (externalInputRef) externalInputRef.current = el;
  }, [externalInputRef]);

  const handleChange = (e) => {
    savedCursor.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
    if (onChange) onChange(e);
  };

  // useLayoutEffect runs synchronously AFTER React updates the DOM,
  // before the browser paints — guaranteed to run after cursor jumps,
  // so the restoration is invisible to the user.
  useLayoutEffect(() => {
    if (savedCursor.current !== null && internalRef.current) {
      try {
        internalRef.current.setSelectionRange(
          savedCursor.current.start,
          savedCursor.current.end
        );
      } catch (_) {
        // type="number" and similar inputs don't support setSelectionRange
      }
      savedCursor.current = null;
    }
  });

  return (
    <TextField
      {...props}
      inputRef={mergedInputRef}
      onChange={handleChange}
    />
  );
}

export default UCTextField;
