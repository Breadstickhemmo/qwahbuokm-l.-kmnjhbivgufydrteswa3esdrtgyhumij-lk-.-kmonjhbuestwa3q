import { Paper, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface GenerateAiCardProps {
  onClick: () => void;
}

export const GenerateAiCard: React.FC<GenerateAiCardProps> = ({ onClick }) => {
  return (
    <Paper
      onClick={onClick}
      sx={{
        width: 210,
        height: 160,
        border: '1px solid',
        borderColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        background: 'linear-gradient(45deg, #6C63FE 30%, #4D91FF 90%)',
        transition: 'transform 0.2s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <AutoAwesomeIcon sx={{ fontSize: 60 }} />
      <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Сгенерировать с ИИ</Typography>
    </Paper>
  );
};