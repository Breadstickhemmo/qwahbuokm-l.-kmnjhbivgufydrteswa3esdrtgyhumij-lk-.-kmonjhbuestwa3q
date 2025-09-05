import React, { useState, useEffect } from 'react';
import { TableCell, TextField, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { useDebounce } from '../../hooks/useDebounce';

interface EditableTableNameCellProps {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
}

export const EditableTableNameCell: React.FC<EditableTableNameCellProps> = ({ initialValue, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (isEditing && debouncedValue !== initialValue) {
      onSave(debouncedValue);
    }
  }, [debouncedValue, isEditing, initialValue, onSave]);

  return (
    <TableCell>
      {isEditing ? (
        <TextField
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          size="small"
          autoFocus
          variant="standard"
        />
      ) : (
        <>
          {value}
          <IconButton size="small" onClick={() => setIsEditing(true)} sx={{ ml: 1, opacity: 0.5 }}>
            <EditIcon fontSize="inherit" />
          </IconButton>
        </>
      )}
    </TableCell>
  );
};