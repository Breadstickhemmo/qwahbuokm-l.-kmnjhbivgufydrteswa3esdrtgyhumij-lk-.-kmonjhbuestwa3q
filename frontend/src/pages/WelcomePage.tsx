import React, { useState, useRef } from 'react';
import { Box, Divider } from '@mui/material';
import { Header } from '../components/common/Header';
import { HeroSection } from '../components/WelcomePage/HeroSection';
import { FeaturesSection } from '../components/WelcomePage/FeaturesSection';
import { Footer } from '../components/common/Footer';
import { AuthModal } from '../components/common/AuthModal';

type FormType = 'login' | 'register';

export const WelcomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>('login');
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenModal = (type: FormType, event: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setFormType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onLoginClick={(e) => handleOpenModal('login', e)}
        onRegisterClick={(e) => handleOpenModal('register', e)}
      />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection onRegisterClick={(e) => handleOpenModal('register', e)} />
        <Divider />
        <FeaturesSection />
      </Box>
      <Footer />
      <AuthModal
        open={isModalOpen}
        onClose={handleCloseModal}
        initialFormType={formType}
      />
    </Box>
  );
};