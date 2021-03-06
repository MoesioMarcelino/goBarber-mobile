import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Button as ButtonRN,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'react-native-image-picker/src';
import Modal from 'react-native-modal';

import {
  Container,
  BackButton,
  Title,
  UserAvatarButton,
  UserAvatar,
  UploadButton,
  LogoutButton,
  LogoutButtonText,
} from './styles';

import Input from '../../components/Input';
import Button from '../../components/Button';
import {useNavigation} from '@react-navigation/native';
import {FormHandles} from '@unform/core';
import {Form} from '@unform/mobile';
import * as Yup from 'yup';
import getValidationErrors from '../../utils/getValidationErrors';
import api from '../../services/api';
import {useAuth} from '../../hooks/Auth';

interface FormProps {
  name: string;
  email: string;
  old_password: string;
  password?: string;
  password_confirmation?: string;
}

const Profile: React.FC = () => {
  const {user, updateUser, signOut} = useAuth();
  const navigation = useNavigation();

  const [showModalUpdateAvatar, setShowModalUpdateAvatar] = useState(false);

  const formRef = useRef<FormHandles>(null);
  const emailInputRef = useRef<TextInput>(null);

  const passwordInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const handleUpdateInformations = useCallback(
    async (data: FormProps) => {
      formRef.current?.setErrors({});
      try {
        const schema = Yup.object().shape<FormProps>({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .email('Digite um e-mail válido')
            .required('E-mail obrigatório'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: (val) => !!val.length,
            then: Yup.string()
              .required('Campo obrigatório')
              .min(6, 'Mínimo de 6 caracteres'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: (val) => !!val.length,
              then: Yup.string()
                .required('Campo obrigatório')
                .min(6, 'Mínimo de 6 caracteres'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), ''], 'Confirmação incorreta'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          name,
          email,
          old_password,
          password,
          password_confirmation,
        } = data;

        const formData = {
          name,
          email,
          ...(old_password
            ? {
                old_password,
                password,
                password_confirmation,
              }
            : {}),
        };

        const response = await api.put('/profile', formData);

        updateUser(response.data);

        navigation.goBack();

        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }

        Alert.alert(
          'Erro de Atualização',
          'Ocorreu um erro na atualização do perfil. Tente novamente!',
        );
      }
    },
    [navigation, updateUser],
  );

  const handleGoBak = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleModal = useCallback(() => {
    setShowModalUpdateAvatar(!showModalUpdateAvatar);
  }, [showModalUpdateAvatar]);

  const updatePhotoFromCamera = useCallback(() => {
    ImagePicker.launchCamera(
      {
        mediaType: 'photo',
        saveToPhotos: true,
        quality: 0.5,
      },
      (response) => {
        console.log(response);
      },
    );
  }, []);

  const updatePhotoFromGallery = useCallback(() => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
      },
      async (response) => {
        const data = new FormData();

        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        const apiResponse = await api.patch('users/avatar', data);

        updateUser(apiResponse.data);
        toggleModal();
      },
    );
  }, [toggleModal, updateUser, user.id]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled>
      <ScrollView
        contentContainerStyle={{flex: 1}}
        keyboardShouldPersistTaps="handled">
        <Container>
          <BackButton onPress={handleGoBak}>
            <Icon name="chevron-left" size={24} color="#999591" />
          </BackButton>
          <UserAvatarButton onPress={toggleModal}>
            <UserAvatar source={{uri: user.avatar_url}} />
          </UserAvatarButton>
          <View>
            <Title>Meu Perfil</Title>
          </View>

          <Form
            initialData={user}
            ref={formRef}
            onSubmit={handleUpdateInformations}>
            <Input
              autoCapitalize="words"
              name="name"
              icon="user"
              placeholder="Nome"
              returnKeyType="next"
              onSubmitEditing={() => {
                emailInputRef.current?.focus();
              }}
            />
            <Input
              ref={emailInputRef}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="email-address"
              name="email"
              icon="mail"
              placeholder="E-mail"
              returnKeyType="next"
              onSubmitEditing={() => {
                oldPasswordInputRef.current?.focus();
              }}
            />
            <Input
              ref={oldPasswordInputRef}
              secureTextEntry
              name="old_password"
              icon="lock"
              placeholder="Senha atual"
              returnKeyType="next"
              containerStyle={{marginTop: 20}}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            <Input
              ref={passwordInputRef}
              secureTextEntry
              name="password"
              icon="lock"
              placeholder="Nova senha"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            />
            <Input
              ref={confirmPasswordInputRef}
              secureTextEntry
              name="password_confirmation"
              icon="lock"
              placeholder="Confirme a nova senha"
              returnKeyType="send"
              onSubmitEditing={() => formRef.current?.submitForm()}
            />

            <Button onPress={() => formRef.current?.submitForm()}>
              Salvar alterações
            </Button>
            <LogoutButton onPress={signOut}>
              <LogoutButtonText>Sair</LogoutButtonText>
            </LogoutButton>
          </Form>
        </Container>
      </ScrollView>
      <Modal
        isVisible={showModalUpdateAvatar}
        backdropOpacity={0.9}
        backdropColor="#3e3b47">
        <UploadButton>
          <ButtonRN title="Usar câmera" onPress={updatePhotoFromCamera} />
        </UploadButton>
        <UploadButton>
          <ButtonRN
            title="Selecionar da galera"
            onPress={updatePhotoFromGallery}
          />
        </UploadButton>
        <UploadButton>
          <ButtonRN title="Cancelar" onPress={toggleModal} color="red" />
        </UploadButton>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Profile;
