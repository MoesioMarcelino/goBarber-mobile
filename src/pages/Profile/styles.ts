import styled from 'styled-components/native';
import {Platform} from 'react-native';
import Button from '../../components/Button';

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 0 30px ${Platform.OS === 'android' ? 150 : 40}px;
  position: relative;
`;

export const BackButton = styled.TouchableOpacity`
  margin-top: 160px;
`;

export const Title = styled.Text`
  font-size: 20px;
  color: #f4ede8;
  font-family: 'RobotoSlab-Medium';
  margin: 24px 0;
`;

export const UserAvatarButton = styled.TouchableOpacity``;

export const UserAvatar = styled.Image`
  width: 186px;
  height: 186px;
  border-radius: 98px;

  align-self: center;
`;

export const UploadButton = styled.View`
  margin-bottom: 20px;
  height: 40px;
`;

export const LogoutButton = styled(Button)`
  background: red;
`;

export const LogoutButtonText = styled.Text`
  color: #fff;
`;
