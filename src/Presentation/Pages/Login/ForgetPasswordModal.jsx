// src/Presentation/Pages/Login/ForgotPasswordModal.jsx
import Modal from '../../Components/Modal/Modal';
import Input from '../../Components/Input/Input';
import Button from '../../Components/Button/Button';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-2">Recupere sua senha</h2>
      <p className="mb-4 text-sm text-gray-600">
        Adicione seu email para enviarmos o link de recuperação de senha
      </p>
      <Input placeholder="crisanvandunem@hotmail.com" label="Email" />
      <div className="mt-4">
        <Button className="w-full bg-green-600 hover:bg-green-700">Enviar</Button>
      </div>
    </Modal>
  );
}
