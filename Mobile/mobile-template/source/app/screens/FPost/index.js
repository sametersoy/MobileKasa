import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon } from '@/components';
import { mobileApi } from '@/api';

const PollCard = ({ poll, buildingId, token, onVoted, colors }) => {
  const [voting, setVoting] = useState(false);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const endDate = new Date(poll.endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const onVote = async (optionId) => {
    if (poll.userVoted || !poll.isActive) return;
    Alert.alert('Oy Kullan', 'Bu seçeneğe oy vermek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Oy Ver',
        onPress: async () => {
          setVoting(true);
          try {
            await mobileApi(token).vote(buildingId, poll.id, optionId);
            onVoted(poll.id, optionId);
          } catch (e) {
            Alert.alert('Hata', e.message ?? 'Oy kullanılamadı.');
          } finally {
            setVoting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card }}>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text body1 bold style={{ flex: 1, marginRight: 8 }}>{poll.question}</Text>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
            backgroundColor: poll.isActive ? colors.primaryLight : BaseColor.fieldColor,
          }}>
            <Text caption2 style={{ color: poll.isActive ? colors.primary : BaseColor.grayColor }}>
              {poll.isActive ? 'Aktif' : 'Sona Erdi'}
            </Text>
          </View>
        </View>
        <Text caption1 grayColor style={{ marginTop: 4 }}>Bitiş: {endDate} · {totalVotes} oy</Text>
      </View>

      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          const canVote = poll.isActive && !poll.userVoted;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onVote(opt.id)}
              disabled={!canVote || voting}
              style={{
                marginBottom: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              <View style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${pct}%`, backgroundColor: colors.primaryLight,
              }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                <Text body2>{opt.text}</Text>
                {(poll.userVoted || !poll.isActive) && (
                  <Text body2 style={{ color: colors.primary }}>{pct}%</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {poll.userVoted && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Icon name="check-circle" size={13} color={colors.primary} />
            <Text caption1 style={{ color: colors.primary }}>Oyunuzu kullandınız.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const FPost = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth?.token);
  const buildingId = useSelector((state) => state.building?.selectedId);

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    const api = mobileApi(token);
    try {
      const res = await api.polls(buildingId);
      setPolls(res.data ?? []);
    } catch (e) {
      console.warn('[Anketler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const onVoted = (pollId, optionId) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          userVoted: true,
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
          ),
        };
      })
    );
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text header bold>Anketler</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={polls}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="poll-h" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Aktif anket bulunmuyor.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PollCard
              poll={item}
              buildingId={buildingId}
              token={token}
              onVoted={onVoted}
              colors={colors}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default FPost;
