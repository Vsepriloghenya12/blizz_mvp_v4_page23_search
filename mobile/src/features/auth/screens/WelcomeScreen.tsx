import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop
} from 'react-native-svg';

type WelcomeScreenProps = {
  onRegister: () => void;
  onLogin: () => void;
};

// ── Вечерний город — полноэкранный ────────────────────────────────────────────
function EveningCity() {
  return (
    <Svg height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 430 700" width="100%">
      <Defs>
        <LinearGradient id="wsky" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0"    stopColor="#04081C" />
          <Stop offset="0.25" stopColor="#080F30" />
          <Stop offset="0.55" stopColor="#0E1F5C" />
          <Stop offset="0.8"  stopColor="#183A8C" />
          <Stop offset="1"    stopColor="#1F4AA0" />
        </LinearGradient>
        <RadialGradient cx="72%" cy="18%" id="wmoon" r="22%">
          <Stop offset="0"   stopColor="#D8EEFF" stopOpacity="0.55" />
          <Stop offset="0.5" stopColor="#90C0F0" stopOpacity="0.2" />
          <Stop offset="1"   stopColor="#183A8C" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient cx="20%" cy="50%" id="wleft" r="40%">
          <Stop offset="0"   stopColor="#4030A0" stopOpacity="0.3" />
          <Stop offset="1"   stopColor="#0E1F5C" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="wbfar" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#14306A" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#080F2E" stopOpacity="0.95" />
        </LinearGradient>
        <LinearGradient id="wbnear" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#0C1C48" />
          <Stop offset="1" stopColor="#050A1E" />
        </LinearGradient>
        <LinearGradient id="wbfront" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#08122A" />
          <Stop offset="1" stopColor="#02050E" />
        </LinearGradient>
        <LinearGradient id="wwater" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0"  stopColor="#0C1C50" stopOpacity="0.95" />
          <Stop offset="1"  stopColor="#04081E" />
        </LinearGradient>
        <RadialGradient cx="72%" cy="60%" id="wmrefl" r="20%">
          <Stop offset="0"   stopColor="#80B8FF" stopOpacity="0.28" />
          <Stop offset="1"   stopColor="#183A8C" stopOpacity="0" />
        </RadialGradient>
        {/* Нижний градиент — затемнение под карточку */}
        <LinearGradient id="wbottom" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0"   stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#000000" stopOpacity="0.35" />
          <Stop offset="1"   stopColor="#000000" stopOpacity="0.75" />
        </LinearGradient>
      </Defs>

      {/* Небо */}
      <Rect fill="url(#wsky)"  height={700} width={430} x={0} y={0} />
      <Rect fill="url(#wmoon)" height={700} width={430} x={0} y={0} />
      <Rect fill="url(#wleft)" height={700} width={430} x={0} y={0} />

      {/* Луна */}
      <Ellipse cx={308} cy={110} fill="#A8CEFF" fillOpacity={0.1} rx={80} ry={60} />
      <Ellipse cx={308} cy={110} fill="#C8E4FF" fillOpacity={0.2} rx={44} ry={32} />
      <Circle  cx={308} cy={110} fill="#EEF6FF" r={20} />
      <Circle  cx={308} cy={110} fill="#DDEEFF" fillOpacity={0.55} r={26} />
      <Circle  cx={303} cy={106} fill="#D0E8F8" fillOpacity={0.45} r={5} />
      <Circle  cx={314} cy={116} fill="#D0E8F8" fillOpacity={0.35} r={3} />

      {/* Звёзды */}
      {([
        [22,40,1.1,0.65],[68,28,0.9,0.5],[118,48,1.0,0.55],[163,22,0.8,0.45],
        [205,42,1.1,0.5],[255,28,0.9,0.42],[290,55,0.8,0.38],[270,78,0.7,0.32],
        [375,36,1.0,0.52],[405,50,0.85,0.45],[42,70,0.8,0.32],[145,62,0.9,0.4],
        [245,72,0.75,0.35],[182,86,0.7,0.28],[92,90,0.8,0.3],[350,80,0.75,0.35],
        [50,18,0.9,0.4],[140,30,0.8,0.38],[330,55,0.85,0.42],[400,20,0.9,0.48],
        [170,16,0.75,0.35],[420,65,0.8,0.3],[10,55,0.7,0.3],[380,90,0.8,0.35],
      ] as [number,number,number,number][]).map(([cx,cy,r,op],i) => (
        <Circle key={i} cx={cx} cy={cy} fill="#FFFFFF" fillOpacity={op} r={r} />
      ))}

      {/* Дальний план */}
      <Path
        d="M0 440 V358 h16 v-40 h10 v-28 h8 v28 h8 V358 h10
           V322 h18 v36 h8 V308 h22 v-34 h10 v34 h10 v48 h6
           V330 h24 v28 h12 V318 h20 v-30 h12 v30 h14 v40 h8
           V328 h18 v30 h14 V308 h10 v-32 h8 v32 h14 v50 h8
           V336 h24 v22 h10 V320 h20 v-28 h12 v28 h12 v38 h8
           V330 h16 v-35 h8 v35 h14 v48 h6
           V348 h22 v-38 h10 v38 h10 v20 h20
           V440z"
        fill="url(#wbfar)"
      />

      {/* Средний план */}
      <Path
        d="M0 440 V372 h20 v-52 h14 v52 h10
           V360 h18 v-46 h12 v-14 h8 v14 h12 v46 h8
           V362 h22 v-50 h14 v50 h10
           V358 h20 v-42 h14 v-16 h8 v16 h14 v42 h8
           V365 h24 v-48 h16 v48 h8
           V360 h18 v-44 h12 v44 h8
           V355 h24 v-50 h14 v-18 h8 v18 h14 v50 h8
           V362 h20 v-46 h14 v46 h8
           V358 h22 v-42 h12 v42 h8
           V440z"
        fill="url(#wbnear)"
      />

      {/* Передний план */}
      <Path
        d="M0 440 V402 h26 v-60 h18 V402 h12
           V395 h24 v-64 h16 v-18 h8 v18 h16 v64 h10
           V398 h20 v-56 h14 v56 h8
           V400 h26 v-66 h18 v-20 h8 v20 h18 v66 h10
           V396 h22 v-58 h14 v58 h8
           V400 h24 v-60 h16 v-16 h8 v16 h16 v60 h8
           V398 h20 v-52 h12 v52 h8
           V440z"
        fill="url(#wbfront)"
      />

      {/* Окна */}
      {([
        [10,395,'#FFB860',0.85],[24,395,'#FFCC80',0.7],[10,383,'#FF9830',0.6],[24,383,'#FFD090',0.5],
        [48,390,'#FFC070',0.8],[63,390,'#FFAA50',0.65],[48,378,'#FFB060',0.55],
        [80,382,'#FFA040',0.75],[94,382,'#FFE890',0.6],[80,370,'#FFBB60',0.5],
        [120,388,'#FFB860',0.8],[135,388,'#FFA040',0.65],[120,376,'#FF9030',0.5],
        [162,390,'#FFCC80',0.75],[177,390,'#FFA040',0.6],[162,378,'#FFB060',0.55],
        [200,383,'#FFB060',0.8],[215,383,'#FFEE90',0.65],[200,371,'#FFA040',0.5],
        [240,386,'#FFB860',0.75],[255,386,'#FF9030',0.6],[240,374,'#FFCC80',0.5],
        [280,380,'#FFC070',0.8],[295,380,'#FFAA50',0.65],[280,368,'#FFB060',0.55],
        [318,388,'#FFD090',0.75],[333,388,'#FFA040',0.6],[318,376,'#FFB860',0.55],
        [358,382,'#FFB860',0.8],[373,382,'#FFCC80',0.65],[358,370,'#FF9030',0.5],
        [396,390,'#FFA040',0.75],[411,390,'#FFB060',0.6],
        // Голубые
        [38,387,'#A0C8FF',0.45],[106,380,'#90C0FF',0.4],[220,376,'#A0D0FF',0.4],
        [300,386,'#90BCFF',0.38],[345,380,'#A0C8FF',0.42],
      ] as [number,number,string,number][]).map(([x,y,color,op],i) => (
        <Rect key={i} fill={color} fillOpacity={op} height={5} rx={1} width={6} x={x} y={y} />
      ))}

      {/* Вода */}
      <Path
        d="M0 440 Q55 430 120 444 Q195 458 265 438 Q340 420 430 444 V700 H0Z"
        fill="url(#wwater)"
      />
      <Rect fill="#030812" fillOpacity={0.5} height={260} width={430} x={0} y={440} />
      <Rect fill="url(#wmrefl)" height={260} width={430} x={0} y={440} />

      {/* Рябь воды */}
      {([
        [50,462,28],[130,476,22],[210,468,26],[300,480,20],[390,472,24],
        [80,490,18],[170,498,22],[260,488,20],[360,500,18],
        [60,514,24],[160,522,18],[270,512,22],[380,520,16],
      ] as [number,number,number][]).map(([cx,y,w],i) => (
        <Path
          key={i}
          d={`M${cx-w} ${y} Q${cx} ${y-3} ${cx+w} ${y}`}
          fill="none"
          stroke="#4070B8"
          strokeOpacity={0.18}
          strokeWidth={1}
        />
      ))}

      {/* Нижнее затемнение для текста */}
      <Rect fill="url(#wbottom)" height={360} width={430} x={0} y={340} />
    </Svg>
  );
}

// ── Фича-пилюля ───────────────────────────────────────────────────────────────
function FeaturePill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

// ── Экран ─────────────────────────────────────────────────────────────────────
export function WelcomeScreen({ onRegister, onLogin }: WelcomeScreenProps) {
  return (
    <View style={styles.root}>
      {/* Полноэкранный город */}
      <View style={styles.cityWrap}>
        <EveningCity />
      </View>

      {/* Оверлей с контентом */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.content}>

          {/* Логотип и слоган */}
          <View style={styles.logoBlock}>
            <Text style={styles.logo}>Близзз</Text>
            <Text style={styles.slogan}>Открой свой город по-новому</Text>
          </View>

          {/* Фичи */}
          <View style={styles.pills}>
            <FeaturePill emoji="📍" text="Места рядом" />
            <FeaturePill emoji="🏪" text="Бизнес и скидки" />
            <FeaturePill emoji="👥" text="Люди вокруг" />
          </View>

          {/* Кнопки */}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              onPress={onRegister}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnPrimaryText}>Начать — это бесплатно</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onLogin}
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.btnSecondaryText}>Уже есть аккаунт? <Text style={styles.btnSecondaryLink}>Войти</Text></Text>
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#04081C'
  },
  cityWrap: {
    ...StyleSheet.absoluteFill
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 28,
  },

  logoBlock: {
    alignItems: 'center',
    marginBottom: 32
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 58,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -2.5,
    lineHeight: 62,
    textShadow: '0px 3px 16px rgba(0,30,100,0.6)'
  } as any,
  slogan: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
    marginTop: 6,
    textAlign: 'center'
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 36
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  pillEmoji: {
    fontSize: 15
  },
  pillText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500'
  },

  buttons: {
    gap: 12
  },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 56,
    justifyContent: 'center'
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  btnPrimaryText: {
    color: '#0B3D99',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  btnSecondary: {
    alignItems: 'center',
    paddingVertical: 10
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15
  },
  btnSecondaryLink: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
