import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import {useAuth} from '../../hooks/Auth';

import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatarButton,
  UserAvatar,
  Content,
  ProvidersListContainer,
  ProviderList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePickerButton,
  OpenDatePickerButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  CreateAppointmentButton,
  CreateAppointmentButtonText,
} from './styles';
import api from '../../services/api';
import {Alert, Platform} from 'react-native';
import {format} from 'date-fns';

interface RouteParams {
  providerId: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface AvailabilityItem {
  hour: number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const {user} = useAuth();
  const {params} = useRoute();
  const routeParams = params as RouteParams;
  const {goBack, navigate} = useNavigation();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(0);

  useEffect(() => {
    async function loadProviders() {
      const response = await api.get('providers');

      setProviders(response.data);
    }

    loadProviders();
  }, []);

  useEffect(() => {
    async function loadDayAvailability() {
      const response = await api.get(
        `providers/${selectedProvider}/day-availability`,
        {
          params: {
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
            day: selectedDate.getDate(),
          },
        },
      );

      setAvailability(response.data);
    }

    loadDayAvailability();
  }, [selectedDate, selectedProvider]);

  const navigateBackDashboard = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker((oldState) => !oldState);
  }, []);

  const handleDateChanged = useCallback(
    (event: any, date: Date | undefined) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }

      if (date) {
        setSelectedDate(date);
      }

      if (selectedHour) {
        setSelectedHour(null);
      }
    },
    [selectedHour],
  );

  const morningAvailability = useMemo(() => {
    return availability
      .filter(({hour}) => hour < 12)
      .map(({hour, available}) => ({
        hour,
        available,
        hourFormatted: format(new Date().setHours(hour), 'HH:00'),
      }));
  }, [availability]);

  const afternoonAvailability = useMemo(() => {
    return availability
      .filter(({hour}) => hour >= 12)
      .map(({hour, available}) => ({
        hour,
        available,
        hourFormatted: format(new Date().setHours(hour), 'HH:00'),
      }));
  }, [availability]);

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const handleCreateAppointment = useCallback(async () => {
    try {
      if (selectedHour) {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();

        const date = `${year}-${month}-${day} ${selectedHour}:00:00`;

        console.log(date);

        await api.post('/appointments', {
          provider_id: selectedProvider,
          date,
        });

        navigate('AppointmentCreated', {
          date: new Date(year, month, day, selectedHour).getTime(),
        });
      }
    } catch (err) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar o agendamento. Tente novamente',
      );
    }
  }, [navigate, selectedDate, selectedHour, selectedProvider]);

  const goToProfile = useCallback(() => {
    navigate('Profile');
  }, [navigate]);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBackDashboard}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>Cabeleireiros</HeaderTitle>

        <UserAvatarButton onPress={goToProfile}>
          <UserAvatar source={{uri: user.avatar_url}} />
        </UserAvatarButton>
      </Header>

      <Content>
        <ProvidersListContainer>
          <ProviderList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={(provider) => provider.id}
            renderItem={({item: provider}) => (
              <ProviderContainer
                onPress={() => handleSelectProvider(provider.id)}
                selected={provider.id === selectedProvider}>
                <ProviderAvatar source={{uri: provider.avatar_url}} />
                <ProviderName selected={provider.id === selectedProvider}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProvidersListContainer>

        <Calendar>
          <Title>Escolha a data</Title>

          <OpenDatePickerButton onPress={handleToggleDatePicker}>
            <OpenDatePickerButtonText>
              Selecionar outra data
            </OpenDatePickerButtonText>
          </OpenDatePickerButton>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="calendar"
              onChange={handleDateChanged}
            />
          )}
        </Calendar>

        <Schedule>
          <Title>Escolha um horário</Title>

          <Section>
            <SectionTitle>Manhã</SectionTitle>
            <SectionContent>
              {morningAvailability.map(({hour, hourFormatted, available}) => (
                <Hour
                  key={hourFormatted}
                  enabled={available}
                  selected={selectedHour === hour}
                  available={available}
                  onPress={() => handleSelectHour(hour)}>
                  <HourText selected={selectedHour === hour}>
                    {hourFormatted}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent>
              {afternoonAvailability.map(({hour, hourFormatted, available}) => (
                <Hour
                  key={hourFormatted}
                  enabled={available}
                  selected={selectedHour === hour}
                  available={available}
                  onPress={() => handleSelectHour(hour)}>
                  <HourText selected={selectedHour === hour}>
                    {hourFormatted}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>
        </Schedule>

        <CreateAppointmentButton onPress={handleCreateAppointment}>
          <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
        </CreateAppointmentButton>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
