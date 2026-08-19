/* ============================================================
   Мок-данные: база продуктов, блюда для «фото», программы
   ============================================================ */

/* Категории продуктов */
const CATS = [
  {id:'ready',  name:'Готовые',  emoji:'🍲'},
  {id:'meat',   name:'Мясо и рыба', emoji:'🍗'},
  {id:'grain',  name:'Крупы и гарниры', emoji:'🍚'},
  {id:'dairy',  name:'Молочное', emoji:'🥛'},
  {id:'veg',    name:'Овощи',    emoji:'🥦'},
  {id:'fruit',  name:'Фрукты',   emoji:'🍎'},
  {id:'fat',    name:'Орехи и масла', emoji:'🥜'},
  {id:'sweet',  name:'Сладкое',  emoji:'🍫'},
  {id:'drink',  name:'Напитки',  emoji:'☕'},
];
const CAT_BY_ID = Object.fromEntries(CATS.map(c=>[c.id,c]));

/* Продукты — значения на 100 г */
const FOODS = [
  /* --- мясо, птица, рыба --- */
  {id:'chicken',      name:'Куриная грудка',      cat:'meat',  kcal:165, p:31.0, f:3.6,  c:0},
  {id:'chickenthigh', name:'Куриное бедро',       cat:'meat',  kcal:185, p:16.8, f:13.4, c:0},
  {id:'mincechicken', name:'Фарш куриный',        cat:'meat',  kcal:143, p:17.4, f:8.0,  c:0},
  {id:'chickencutlet',name:'Котлета куриная',     cat:'meat',  kcal:220, p:15.0, f:14.0, c:8.0},
  {id:'chickenliver', name:'Печень куриная',      cat:'meat',  kcal:137, p:20.4, f:5.9,  c:0.7},
  {id:'turkey',       name:'Индейка, филе',       cat:'meat',  kcal:104, p:19.2, f:2.2,  c:0},
  {id:'beef',         name:'Говядина отварная',   cat:'meat',  kcal:254, p:25.8, f:16.8, c:0},
  {id:'mince',        name:'Фарш говяжий',        cat:'meat',  kcal:250, p:18.0, f:20.0, c:0},
  {id:'pork',         name:'Свинина жареная',     cat:'meat',  kcal:259, p:16.0, f:23.0, c:0},
  {id:'shashlik',     name:'Шашлык свиной',       cat:'meat',  kcal:280, p:20.0, f:22.0, c:1.0},
  {id:'bacon',        name:'Бекон',               cat:'meat',  kcal:500, p:23.0, f:45.0, c:0},
  {id:'ham',          name:'Ветчина',             cat:'meat',  kcal:165, p:17.0, f:10.0, c:1.0},
  {id:'sausage',      name:'Сосиски',             cat:'meat',  kcal:266, p:10.4, f:24.0, c:1.6},
  {id:'bologna',      name:'Колбаса варёная',     cat:'meat',  kcal:257, p:12.8, f:22.2, c:1.5},
  {id:'salmon',       name:'Лосось запечённый',   cat:'meat',  kcal:208, p:22.1, f:12.4, c:0},
  {id:'cod',          name:'Треска',              cat:'meat',  kcal:78,  p:17.7, f:0.7,  c:0},
  {id:'herring',      name:'Сельдь',              cat:'meat',  kcal:217, p:17.0, f:19.0, c:0},
  {id:'tuna',         name:'Тунец консерв.',      cat:'meat',  kcal:96,  p:22.0, f:1.0,  c:0},
  {id:'shrimp',       name:'Креветки',            cat:'meat',  kcal:87,  p:18.3, f:1.2,  c:0},
  {id:'egg',          name:'Яйцо куриное',        cat:'meat',  kcal:157, p:12.7, f:11.5, c:0.7},

  /* --- крупы, гарниры, хлеб --- */
  {id:'buckwheat',    name:'Гречка отварная',     cat:'grain', kcal:110, p:4.2,  f:1.1,  c:21.3},
  {id:'rice',         name:'Рис отварной',        cat:'grain', kcal:116, p:2.2,  f:0.5,  c:24.9},
  {id:'brownrice',    name:'Рис бурый',           cat:'grain', kcal:111, p:2.6,  f:0.9,  c:23.0},
  {id:'oat',          name:'Овсянка на воде',     cat:'grain', kcal:88,  p:3.0,  f:1.7,  c:15.0},
  {id:'oatmilk',      name:'Овсянка на молоке',   cat:'grain', kcal:105, p:3.2,  f:4.1,  c:14.0},
  {id:'millet',       name:'Пшённая каша',        cat:'grain', kcal:90,  p:3.0,  f:0.7,  c:17.0},
  {id:'pearlbarley',  name:'Перловка',            cat:'grain', kcal:106, p:3.0,  f:0.4,  c:22.2},
  {id:'bulgur',       name:'Булгур',              cat:'grain', kcal:83,  p:3.0,  f:0.2,  c:18.6},
  {id:'quinoa',       name:'Киноа',               cat:'grain', kcal:120, p:4.4,  f:1.9,  c:21.3},
  {id:'couscous',     name:'Кускус',              cat:'grain', kcal:112, p:3.8,  f:0.2,  c:23.2},
  {id:'pasta',        name:'Макароны отварные',   cat:'grain', kcal:112, p:3.5,  f:0.4,  c:23.2},
  {id:'spaghetti',    name:'Спагетти отварные',   cat:'grain', kcal:158, p:5.8,  f:0.9,  c:30.9},
  {id:'noodles',      name:'Лапша яичная',        cat:'grain', kcal:138, p:4.5,  f:2.1,  c:25.0},
  {id:'potato',       name:'Картофель варёный',   cat:'grain', kcal:82,  p:2.0,  f:0.4,  c:16.7},
  {id:'mashedpotato', name:'Картофельное пюре',   cat:'grain', kcal:106, p:2.2,  f:4.2,  c:14.7},
  {id:'friedpotato',  name:'Картофель жареный',   cat:'grain', kcal:192, p:2.8,  f:9.5,  c:23.4},
  {id:'bread',        name:'Хлеб цельнозерновой', cat:'grain', kcal:247, p:8.5,  f:3.3,  c:45.0},
  {id:'whitebread',   name:'Батон белый',         cat:'grain', kcal:264, p:7.5,  f:2.9,  c:50.9},

  /* --- молочное --- */
  {id:'milk',         name:'Молоко 2.5%',         cat:'dairy', kcal:52,  p:2.8,  f:2.5,  c:4.7},
  {id:'kefir',        name:'Кефир 1%',            cat:'dairy', kcal:40,  p:3.0,  f:1.0,  c:4.0},
  {id:'ryazhenka',    name:'Ряженка',             cat:'dairy', kcal:54,  p:2.9,  f:2.5,  c:4.2},
  {id:'yogurt',       name:'Йогурт натуральный',  cat:'dairy', kcal:66,  p:5.0,  f:3.2,  c:4.0},
  {id:'drinkyogurt',  name:'Йогурт питьевой',     cat:'dairy', kcal:68,  p:2.8,  f:1.5,  c:11.0},
  {id:'cottage',      name:'Творог 5%',           cat:'dairy', kcal:121, p:17.2, f:5.0,  c:1.8},
  {id:'cottage9',     name:'Творог 9%',           cat:'dairy', kcal:159, p:16.7, f:9.0,  c:2.0},
  {id:'cottage0',     name:'Творог обезжиренный', cat:'dairy', kcal:71,  p:16.5, f:0.6,  c:1.3},
  {id:'syrniki',      name:'Сырники',             cat:'dairy', kcal:220, p:17.0, f:11.0, c:18.0},
  {id:'glazedcurd',   name:'Сырок глазированный', cat:'dairy', kcal:407, p:8.5,  f:27.8, c:32.0},
  {id:'sourcream',    name:'Сметана 20%',         cat:'dairy', kcal:206, p:2.6,  f:20.0, c:3.2},
  {id:'cheese',       name:'Сыр полутвёрдый',     cat:'dairy', kcal:356, p:25.0, f:28.0, c:0},
  {id:'parmesan',     name:'Пармезан',            cat:'dairy', kcal:392, p:36.0, f:26.0, c:4.0},
  {id:'meltcheese',   name:'Сыр плавленый',       cat:'dairy', kcal:257, p:12.0, f:22.0, c:3.0},
  {id:'butter',       name:'Масло сливочное',     cat:'dairy', kcal:748, p:0.5,  f:82.5, c:0.8},

  /* --- овощи --- */
  {id:'cucumber',     name:'Огурец',              cat:'veg',   kcal:15,  p:0.8,  f:0.1,  c:2.5},
  {id:'tomatofresh',  name:'Помидор',             cat:'veg',   kcal:20,  p:1.1,  f:0.2,  c:3.7},
  {id:'cabbage',      name:'Капуста белокочанная',cat:'veg',   kcal:28,  p:1.8,  f:0.1,  c:4.7},
  {id:'sauerkraut',   name:'Квашеная капуста',    cat:'veg',   kcal:19,  p:1.8,  f:0.1,  c:3.0},
  {id:'broccoli',     name:'Брокколи',            cat:'veg',   kcal:34,  p:2.8,  f:0.4,  c:6.6},
  {id:'carrot',       name:'Морковь',             cat:'veg',   kcal:35,  p:1.3,  f:0.1,  c:6.9},
  {id:'beet',         name:'Свёкла',              cat:'veg',   kcal:42,  p:1.5,  f:0.1,  c:8.8},
  {id:'onion',        name:'Лук репчатый',        cat:'veg',   kcal:41,  p:1.4,  f:0,    c:8.2},
  {id:'zucchini',     name:'Кабачок',             cat:'veg',   kcal:24,  p:0.6,  f:0.3,  c:4.6},
  {id:'eggplant',     name:'Баклажан',            cat:'veg',   kcal:24,  p:1.2,  f:0.1,  c:4.5},
  {id:'bellpepper',   name:'Перец болгарский',    cat:'veg',   kcal:27,  p:1.3,  f:0,    c:5.3},
  {id:'lettuce',      name:'Салат листовой',      cat:'veg',   kcal:15,  p:1.4,  f:0.2,  c:2.2},
  {id:'mushroom',     name:'Шампиньоны',          cat:'veg',   kcal:22,  p:4.3,  f:1.0,  c:0.1},
  {id:'greenpeas',    name:'Зелёный горошек',     cat:'veg',   kcal:73,  p:5.0,  f:0.2,  c:12.8},
  {id:'corn',         name:'Кукуруза консерв.',   cat:'veg',   kcal:58,  p:2.2,  f:0.4,  c:11.2},
  {id:'tomato',       name:'Соус томатный',       cat:'veg',   kcal:62,  p:1.5,  f:2.5,  c:8.0},

  /* --- фрукты и ягоды --- */
  {id:'apple',        name:'Яблоко',              cat:'fruit', kcal:52,  p:0.4,  f:0.4,  c:11.8},
  {id:'banana',       name:'Банан',               cat:'fruit', kcal:96,  p:1.5,  f:0.2,  c:21.8},
  {id:'orange',       name:'Апельсин',            cat:'fruit', kcal:43,  p:0.9,  f:0.2,  c:8.1},
  {id:'mandarin',     name:'Мандарин',            cat:'fruit', kcal:38,  p:0.8,  f:0.2,  c:7.5},
  {id:'pear',         name:'Груша',               cat:'fruit', kcal:47,  p:0.4,  f:0.3,  c:10.9},
  {id:'grape',        name:'Виноград',            cat:'fruit', kcal:65,  p:0.6,  f:0.2,  c:16.8},
  {id:'kiwi',         name:'Киви',                cat:'fruit', kcal:47,  p:0.8,  f:0.4,  c:10.3},
  {id:'peach',        name:'Персик',              cat:'fruit', kcal:39,  p:0.9,  f:0.1,  c:9.5},
  {id:'watermelon',   name:'Арбуз',               cat:'fruit', kcal:27,  p:0.6,  f:0.1,  c:5.8},
  {id:'berries',      name:'Ягоды свежие',        cat:'fruit', kcal:46,  p:0.8,  f:0.4,  c:9.6},
  {id:'raisin',       name:'Изюм',                cat:'fruit', kcal:264, p:2.9,  f:0.6,  c:66.0},
  {id:'driedapricot', name:'Курага',              cat:'fruit', kcal:232, p:5.2,  f:0.3,  c:51.0},
  {id:'prune',        name:'Чернослив',           cat:'fruit', kcal:231, p:2.3,  f:0.7,  c:57.5},
  {id:'dates',        name:'Финики',              cat:'fruit', kcal:292, p:2.5,  f:0.5,  c:69.2},

  /* --- орехи, масла, добавки --- */
  {id:'walnut',       name:'Грецкий орех',        cat:'fat',   kcal:654, p:15.2, f:65.2, c:7.0},
  {id:'almond',       name:'Миндаль',             cat:'fat',   kcal:609, p:18.6, f:53.7, c:13.0},
  {id:'cashew',       name:'Кешью',               cat:'fat',   kcal:553, p:18.2, f:43.8, c:30.2},
  {id:'hazelnut',     name:'Фундук',              cat:'fat',   kcal:628, p:15.0, f:61.0, c:16.7},
  {id:'peanut',       name:'Арахис',              cat:'fat',   kcal:567, p:26.0, f:49.0, c:16.0},
  {id:'peanutbutter', name:'Арахисовая паста',    cat:'fat',   kcal:588, p:25.0, f:50.0, c:20.0},
  {id:'sunflowerseed',name:'Семечки',             cat:'fat',   kcal:601, p:20.7, f:52.9, c:10.5},
  {id:'avocado',      name:'Авокадо',             cat:'fat',   kcal:160, p:2.0,  f:14.7, c:8.5},
  {id:'oliveoil',     name:'Масло оливковое',     cat:'fat',   kcal:884, p:0,    f:100,  c:0},
  {id:'sunfloweroil', name:'Масло подсолнечное',  cat:'fat',   kcal:899, p:0,    f:99.9, c:0},
  {id:'protein',      name:'Протеин (порошок)',   cat:'fat',   kcal:373, p:75.0, f:5.0,  c:8.0},

  /* --- сладкое и выпечка --- */
  {id:'milkchoc',     name:'Шоколад молочный',    cat:'sweet', kcal:535, p:6.9,  f:29.7, c:59.4},
  {id:'darkchoc',     name:'Шоколад тёмный',      cat:'sweet', kcal:546, p:6.2,  f:35.4, c:48.2},
  {id:'cookie',       name:'Печенье',             cat:'sweet', kcal:417, p:7.5,  f:11.8, c:74.4},
  {id:'gingerbread',  name:'Пряник',              cat:'sweet', kcal:364, p:4.8,  f:2.8,  c:77.0},
  {id:'marshmallow',  name:'Зефир',               cat:'sweet', kcal:326, p:0.8,  f:0.1,  c:79.8},
  {id:'halva',        name:'Халва',               cat:'sweet', kcal:523, p:11.6, f:29.7, c:54.0},
  {id:'icecream',     name:'Мороженое пломбир',   cat:'sweet', kcal:207, p:3.7,  f:11.0, c:23.2},
  {id:'croissant',    name:'Круассан',            cat:'sweet', kcal:406, p:8.2,  f:21.0, c:45.8},
  {id:'pancake',      name:'Блины',               cat:'sweet', kcal:233, p:6.1,  f:12.3, c:26.0},
  {id:'jam',          name:'Варенье',             cat:'sweet', kcal:271, p:0.3,  f:0.1,  c:68.0},
  {id:'honey',        name:'Мёд',                 cat:'sweet', kcal:329, p:0.8,  f:0,    c:81.5},
  {id:'sugar',        name:'Сахар',               cat:'sweet', kcal:399, p:0,    f:0,    c:99.8},
  {id:'proteinbar',   name:'Протеиновый батончик',cat:'sweet', kcal:350, p:30.0, f:10.0, c:35.0},

  /* --- напитки --- */
  {id:'coffee',       name:'Кофе чёрный',         cat:'drink', kcal:2,   p:0.2,  f:0,    c:0.3},
  {id:'coffeemilk',   name:'Кофе с молоком',      cat:'drink', kcal:42,  p:2.0,  f:2.0,  c:4.0},
  {id:'tea',          name:'Чай без сахара',      cat:'drink', kcal:1,   p:0,    f:0,    c:0.2},
  {id:'orangejuice',  name:'Сок апельсиновый',    cat:'drink', kcal:45,  p:0.7,  f:0.1,  c:10.4},
  {id:'compote',      name:'Компот',              cat:'drink', kcal:60,  p:0.1,  f:0,    c:15.0},
  {id:'cola',         name:'Кола',                cat:'drink', kcal:42,  p:0,    f:0,    c:10.6},
  {id:'beer',         name:'Пиво светлое',        cat:'drink', kcal:43,  p:0.6,  f:0,    c:3.6},
  {id:'winedry',      name:'Вино сухое',          cat:'drink', kcal:68,  p:0.2,  f:0,    c:0.3},

  /* --- готовые блюда --- */
  {id:'borsch',       name:'Борщ',                cat:'ready', kcal:49,  p:1.1,  f:2.2,  c:6.7},
  {id:'shchi',        name:'Щи',                  cat:'ready', kcal:32,  p:1.0,  f:1.9,  c:2.9},
  {id:'solyanka',     name:'Солянка',             cat:'ready', kcal:61,  p:3.5,  f:4.1,  c:2.6},
  {id:'chickensoup',  name:'Куриный суп',         cat:'ready', kcal:36,  p:2.6,  f:1.2,  c:3.7},
  {id:'plov',         name:'Плов',                cat:'ready', kcal:216, p:9.1,  f:8.3,  c:26.0},
  {id:'pelmeni',      name:'Пельмени отварные',   cat:'ready', kcal:252, p:11.9, f:12.4, c:24.0},
  {id:'olivier',      name:'Оливье',              cat:'ready', kcal:198, p:5.5,  f:16.0, c:8.3},
  {id:'vinegret',     name:'Винегрет',            cat:'ready', kcal:130, p:1.4,  f:10.3, c:8.2},
  {id:'pizza',        name:'Пицца',               cat:'ready', kcal:266, p:11.0, f:10.0, c:33.0},
  {id:'burger',       name:'Бургер',              cat:'ready', kcal:295, p:17.0, f:14.0, c:24.0},
  {id:'shaurma',      name:'Шаурма',              cat:'ready', kcal:214, p:12.0, f:11.0, c:17.0},
  {id:'sushiroll',    name:'Роллы',               cat:'ready', kcal:180, p:7.0,  f:6.0,  c:25.0},
  {id:'nuggets',      name:'Наггетсы',            cat:'ready', kcal:297, p:15.0, f:18.0, c:18.0},
  {id:'frenchfries',  name:'Картофель фри',       cat:'ready', kcal:312, p:3.4,  f:15.0, c:41.0},
];
const FOOD_BY_ID = Object.fromEntries(FOODS.map(f=>[f.id,f]));

/* Фикстуры блюд — для проверки драйверов распознавания, когда они появятся */
const DISHES = [
  {name:'Паста болоньезе', emoji:'🍝', ing:[
    {id:'spaghetti',g:180},{id:'mince',g:120},{id:'tomato',g:90},{id:'parmesan',g:15}]},
  {name:'Куриный суп с лапшой', emoji:'🍜', ing:[
    {id:'chicken',g:90},{id:'noodles',g:70},{id:'carrot',g:40},{id:'potato',g:80}]},
  {name:'Овсянка с ягодами', emoji:'🥣', ing:[
    {id:'oat',g:250},{id:'berries',g:60},{id:'honey',g:15},{id:'walnut',g:10}]},
  {name:'Лосось с брокколи', emoji:'🐟', ing:[
    {id:'salmon',g:160},{id:'broccoli',g:150},{id:'oliveoil',g:8}]},
];

/* Шаблоны тренировок */
const PROGRAMS = [
  {
    id:'p1', name:'Грудь и трицепс', type:'strength', emoji:'🏋️', est:45, rest:90,
    ex:[
      {name:'Жим гантелей лёжа',        sets:4, reps:'8–10', w:22},
      {name:'Жим штанги на наклонной',  sets:4, reps:'8',    w:40},
      {name:'Разводка гантелей',        sets:3, reps:'12',   w:12},
      {name:'Отжимания на брусьях',     sets:3, reps:'10',   w:0},
      {name:'Французский жим',          sets:3, reps:'12',   w:20},
    ]
  },
  {
    id:'p2', name:'Спина и бицепс', type:'strength', emoji:'🎯', est:50, rest:90,
    ex:[
      {name:'Тяга верхнего блока',      sets:4, reps:'10',   w:45},
      {name:'Тяга штанги в наклоне',    sets:4, reps:'8',    w:50},
      {name:'Тяга гантели одной рукой', sets:3, reps:'10',   w:24},
      {name:'Подъём штанги на бицепс',  sets:3, reps:'12',   w:25},
      {name:'Молотковые сгибания',      sets:3, reps:'12',   w:14},
    ]
  },
  {
    id:'p3', name:'Ноги и плечи', type:'strength', emoji:'🦵', est:55, rest:120,
    ex:[
      {name:'Приседания со штангой',    sets:4, reps:'8',    w:60},
      {name:'Румынская тяга',           sets:4, reps:'10',   w:50},
      {name:'Жим ногами',               sets:3, reps:'12',   w:120},
      {name:'Жим гантелей сидя',        sets:4, reps:'10',   w:16},
      {name:'Махи в стороны',           sets:3, reps:'15',   w:8},
    ]
  },
  {
    id:'p4', name:'Пробежка', type:'cardio', emoji:'🏃', est:35, rest:0,
    cardio:{kind:'run', targetMin:35, targetKm:6, met:9.8}
  },
];
const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map(p=>[p.id,p]));

/* MET для оценки расхода */
const MET = {strength:5.0, run:9.8, walk:3.5, bike:7.5};

/* Расписание по умолчанию: 0=Вс … 6=Сб */
const DEFAULT_SCHEDULE = {1:'p1', 2:null, 3:'p2', 4:null, 5:'p4', 6:'p3', 0:null};

const MEALS = [
  {id:'breakfast', name:'Завтрак'},
  {id:'lunch',     name:'Обед'},
  {id:'snack',     name:'Перекус'},
  {id:'dinner',    name:'Ужин'},
];
