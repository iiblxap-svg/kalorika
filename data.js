/* ============================================================
   Мок-данные: база продуктов, блюда для «фото», программы
   ============================================================ */

/* Категории продуктов */
const CATS = [
  {id:'ready', name:'Готовые блюда',  emoji:'🍲'},
  {id:'soup',  name:'Супы',           emoji:'🥣'},
  {id:'meat',  name:'Мясо и птица',   emoji:'🍗'},
  {id:'fish',  name:'Рыба',           emoji:'🐟'},
  {id:'grain', name:'Крупы и гарниры',emoji:'🍚'},
  {id:'bread', name:'Хлеб и выпечка', emoji:'🍞'},
  {id:'dairy', name:'Молочное и яйца',emoji:'🥛'},
  {id:'veg',   name:'Овощи и грибы',  emoji:'🥦'},
  {id:'fruit', name:'Фрукты и ягоды', emoji:'🍎'},
  {id:'nuts',  name:'Орехи и семена', emoji:'🥜'},
  {id:'fat',   name:'Масла и соусы',  emoji:'🫒'},
  {id:'sweet', name:'Сладкое и снеки',emoji:'🍫'},
  {id:'drink', name:'Напитки',        emoji:'☕'},
  {id:'sport', name:'Спортпит',       emoji:'💪'},
];
const CAT_BY_ID = Object.fromEntries(CATS.map(c=>[c.id,c]));

/* Продукты — значения на 100 г */
const FOODS = [
  /* ===== СУПЫ ===== */
  {id:'borsch',      name:'Борщ',                    cat:'soup',  kcal:49,  p:1.1,  f:2.2,  c:6.7},
  {id:'shchi',       name:'Щи',                      cat:'soup',  kcal:32,  p:1.0,  f:1.9,  c:2.9},
  {id:'solyanka',    name:'Солянка',                 cat:'soup',  kcal:61,  p:3.5,  f:4.1,  c:2.6},
  {id:'chickensoup', name:'Куриный суп',             cat:'soup',  kcal:36,  p:2.6,  f:1.2,  c:3.7},
  {id:'rassolnik',   name:'Рассольник',              cat:'soup',  kcal:42,  p:1.4,  f:2.0,  c:4.6},
  {id:'ukha',        name:'Уха',                     cat:'soup',  kcal:46,  p:4.4,  f:2.2,  c:2.1},
  {id:'kharcho',     name:'Харчо',                   cat:'soup',  kcal:76,  p:3.4,  f:4.5,  c:5.6},
  {id:'lagman',      name:'Лагман',                  cat:'soup',  kcal:87,  p:4.5,  f:3.9,  c:8.9},
  {id:'gribnoysup',  name:'Грибной суп',             cat:'soup',  kcal:26,  p:1.1,  f:1.4,  c:2.3},
  {id:'gorohovy',    name:'Гороховый суп',           cat:'soup',  kcal:66,  p:4.4,  f:2.2,  c:8.9},
  {id:'okroshka',    name:'Окрошка',                 cat:'soup',  kcal:55,  p:2.4,  f:3.1,  c:4.6},
  {id:'syrnysup',    name:'Сырный суп',              cat:'soup',  kcal:78,  p:2.8,  f:5.5,  c:4.8},
  {id:'tykvensup',   name:'Тыквенный суп-пюре',      cat:'soup',  kcal:45,  p:1.3,  f:2.1,  c:5.8},
  {id:'bulion',      name:'Куриный бульон',          cat:'soup',  kcal:15,  p:1.7,  f:0.7,  c:0.4},
  {id:'tomatsup',    name:'Томатный суп',            cat:'soup',  kcal:45,  p:1.2,  f:2.0,  c:5.6},

  /* ===== ГОТОВЫЕ БЛЮДА ===== */
  {id:'plov',        name:'Плов',                    cat:'ready', kcal:216, p:9.1,  f:8.3,  c:26.0},
  {id:'pelmeni',     name:'Пельмени отварные',       cat:'ready', kcal:252, p:11.9, f:12.4, c:24.0},
  {id:'vareniki',    name:'Вареники с картошкой',    cat:'ready', kcal:190, p:6.5,  f:5.5,  c:28.0},
  {id:'manty',       name:'Манты',                   cat:'ready', kcal:236, p:12.0, f:12.0, c:20.0},
  {id:'khinkali',    name:'Хинкали',                 cat:'ready', kcal:235, p:11.0, f:10.0, c:25.0},
  {id:'golubtsy',    name:'Голубцы',                 cat:'ready', kcal:118, p:6.5,  f:6.8,  c:7.4},
  {id:'dolma',       name:'Долма',                   cat:'ready', kcal:180, p:8.0,  f:12.0, c:9.0},
  {id:'kotleta',     name:'Котлета домашняя',        cat:'ready', kcal:250, p:15.0, f:18.0, c:8.0},
  {id:'kotletapar',  name:'Котлета паровая',         cat:'ready', kcal:172, p:14.0, f:10.0, c:7.0},
  {id:'kotletakiev', name:'Котлета по-киевски',      cat:'ready', kcal:305, p:17.0, f:22.0, c:9.0},
  {id:'tefteli',     name:'Тефтели',                 cat:'ready', kcal:172, p:11.0, f:9.0,  c:11.0},
  {id:'gulyash',     name:'Гуляш',                   cat:'ready', kcal:148, p:14.0, f:9.0,  c:3.0},
  {id:'befstroganov',name:'Бефстроганов',            cat:'ready', kcal:190, p:16.0, f:12.0, c:5.0},
  {id:'zharkoe',     name:'Жаркое',                  cat:'ready', kcal:130, p:8.0,  f:7.0,  c:9.0},
  {id:'shnitsel',    name:'Шницель',                 cat:'ready', kcal:280, p:17.0, f:18.0, c:12.0},
  {id:'steak',       name:'Стейк говяжий',           cat:'ready', kcal:220, p:26.0, f:13.0, c:0},
  {id:'shashlikkur', name:'Шашлык куриный',          cat:'ready', kcal:180, p:20.0, f:10.0, c:1.0},
  {id:'lulyakebab',  name:'Люля-кебаб',              cat:'ready', kcal:250, p:16.0, f:20.0, c:2.0},
  {id:'kuritsagril', name:'Курица гриль',            cat:'ready', kcal:210, p:22.0, f:13.0, c:1.0},
  {id:'krylyshki',   name:'Куриные крылья',          cat:'ready', kcal:290, p:19.0, f:23.0, c:2.0},
  {id:'nuggets',     name:'Наггетсы',                cat:'ready', kcal:297, p:15.0, f:18.0, c:18.0},
  {id:'makaronyflot',name:'Макароны по-флотски',     cat:'ready', kcal:165, p:9.0,  f:6.0,  c:18.0},
  {id:'lasagna',     name:'Лазанья',                 cat:'ready', kcal:190, p:11.0, f:9.0,  c:16.0},
  {id:'zapekanka',   name:'Творожная запеканка',     cat:'ready', kcal:168, p:17.0, f:5.0,  c:14.0},
  {id:'omlet',       name:'Омлет',                   cat:'ready', kcal:184, p:9.6,  f:15.4, c:1.9},
  {id:'yaichnitsa',  name:'Яичница',                 cat:'ready', kcal:200, p:12.0, f:16.0, c:1.0},
  {id:'kashamanka',  name:'Манная каша на молоке',   cat:'ready', kcal:98,  p:3.0,  f:3.0,  c:15.0},
  {id:'kasharis',    name:'Рисовая каша на молоке',  cat:'ready', kcal:97,  p:2.5,  f:3.0,  c:15.0},
  {id:'olivier',     name:'Оливье',                  cat:'ready', kcal:198, p:5.5,  f:16.0, c:8.3},
  {id:'vinegret',    name:'Винегрет',                cat:'ready', kcal:130, p:1.4,  f:10.3, c:8.2},
  {id:'salatcezar',  name:'Салат Цезарь',            cat:'ready', kcal:190, p:12.0, f:13.0, c:6.0},
  {id:'salatgrech',  name:'Греческий салат',         cat:'ready', kcal:90,  p:2.0,  f:6.0,  c:7.0},
  {id:'salatkrab',   name:'Крабовый салат',          cat:'ready', kcal:190, p:6.0,  f:14.0, c:9.0},
  {id:'shuba',       name:'Селёдка под шубой',       cat:'ready', kcal:190, p:6.0,  f:14.0, c:9.0},
  {id:'holodets',    name:'Холодец',                 cat:'ready', kcal:110, p:12.0, f:6.0,  c:0},
  {id:'pizza',       name:'Пицца',                   cat:'ready', kcal:266, p:11.0, f:10.0, c:33.0},
  {id:'burger',      name:'Бургер',                  cat:'ready', kcal:295, p:17.0, f:14.0, c:24.0},
  {id:'cheeseburger',name:'Чизбургер',               cat:'ready', kcal:303, p:16.0, f:15.0, c:26.0},
  {id:'hotdog',      name:'Хот-дог',                 cat:'ready', kcal:250, p:9.0,  f:14.0, c:22.0},
  {id:'shaurma',     name:'Шаурма',                  cat:'ready', kcal:214, p:12.0, f:11.0, c:17.0},
  {id:'doner',       name:'Донер-кебаб',             cat:'ready', kcal:215, p:13.0, f:10.0, c:18.0},
  {id:'sushiroll',   name:'Роллы',                   cat:'ready', kcal:180, p:7.0,  f:6.0,  c:25.0},
  {id:'frenchfries', name:'Картофель фри',           cat:'ready', kcal:312, p:3.4,  f:15.0, c:41.0},
  {id:'kartderev',   name:'Картофель по-деревенски', cat:'ready', kcal:165, p:3.0,  f:7.0,  c:22.0},
  {id:'sendvich',    name:'Сэндвич с курицей',       cat:'ready', kcal:250, p:12.0, f:12.0, c:24.0},
  {id:'pirozhok',    name:'Пирожок жареный',         cat:'ready', kcal:280, p:6.0,  f:12.0, c:38.0},
  {id:'cheburek',    name:'Чебурек',                 cat:'ready', kcal:264, p:8.0,  f:14.0, c:27.0},
  {id:'belyash',     name:'Беляш',                   cat:'ready', kcal:290, p:9.0,  f:16.0, c:28.0},
  {id:'sosiskatesto',name:'Сосиска в тесте',         cat:'ready', kcal:300, p:8.0,  f:17.0, c:28.0},
  {id:'blinymyaso',  name:'Блины с мясом',           cat:'ready', kcal:240, p:10.0, f:12.0, c:22.0},
  {id:'rybakotleta', name:'Рыбная котлета',          cat:'ready', kcal:145, p:13.0, f:7.0,  c:8.0},

  /* ===== МЯСО И ПТИЦА ===== */
  {id:'chicken',      name:'Куриная грудка',         cat:'meat',  kcal:165, p:31.0, f:3.6,  c:0},
  {id:'chickenthigh', name:'Куриное бедро',          cat:'meat',  kcal:185, p:16.8, f:13.4, c:0},
  {id:'chickendrum',  name:'Куриная голень',         cat:'meat',  kcal:172, p:18.0, f:11.0, c:0},
  {id:'chickenwing',  name:'Куриное крыло',          cat:'meat',  kcal:186, p:19.0, f:12.0, c:0},
  {id:'mincechicken', name:'Фарш куриный',           cat:'meat',  kcal:143, p:17.4, f:8.0,  c:0},
  {id:'chickencutlet',name:'Котлета куриная',        cat:'meat',  kcal:220, p:15.0, f:14.0, c:8.0},
  {id:'chickenliver', name:'Печень куриная',         cat:'meat',  kcal:137, p:20.4, f:5.9,  c:0.7},
  {id:'heart',        name:'Сердце куриное',         cat:'meat',  kcal:96,  p:16.0, f:3.0,  c:0},
  {id:'turkey',       name:'Индейка, филе',          cat:'meat',  kcal:104, p:19.2, f:2.2,  c:0},
  {id:'turkeymince',  name:'Фарш индейки',           cat:'meat',  kcal:161, p:17.0, f:9.0,  c:0},
  {id:'duck',         name:'Утка',                   cat:'meat',  kcal:346, p:16.0, f:38.0, c:0},
  {id:'beef',         name:'Говядина отварная',      cat:'meat',  kcal:254, p:25.8, f:16.8, c:0},
  {id:'veal',         name:'Телятина',               cat:'meat',  kcal:97,  p:20.0, f:2.0,  c:0},
  {id:'mince',        name:'Фарш говяжий',           cat:'meat',  kcal:250, p:18.0, f:20.0, c:0},
  {id:'farshmix',     name:'Фарш свино-говяжий',     cat:'meat',  kcal:268, p:14.0, f:24.0, c:0},
  {id:'pork',         name:'Свинина жареная',        cat:'meat',  kcal:259, p:16.0, f:23.0, c:0},
  {id:'lamb',         name:'Баранина',               cat:'meat',  kcal:209, p:16.0, f:16.0, c:0},
  {id:'rabbit',       name:'Кролик',                 cat:'meat',  kcal:183, p:21.0, f:11.0, c:0},
  {id:'liverbeef',    name:'Печень говяжья',         cat:'meat',  kcal:127, p:17.9, f:3.7,  c:5.3},
  {id:'tongue',       name:'Язык говяжий',           cat:'meat',  kcal:173, p:16.0, f:12.0, c:2.0},
  {id:'shashlik',     name:'Шашлык свиной',          cat:'meat',  kcal:280, p:20.0, f:22.0, c:1.0},
  {id:'bacon',        name:'Бекон',                  cat:'meat',  kcal:500, p:23.0, f:45.0, c:0},
  {id:'salo',         name:'Сало',                   cat:'meat',  kcal:797, p:2.4,  f:89.0, c:0},
  {id:'ham',          name:'Ветчина',                cat:'meat',  kcal:165, p:17.0, f:10.0, c:1.0},
  {id:'buzhenina',    name:'Буженина',               cat:'meat',  kcal:210, p:16.0, f:16.0, c:1.0},
  {id:'karbonad',     name:'Карбонад',               cat:'meat',  kcal:135, p:16.0, f:8.0,  c:0},
  {id:'pastrami',     name:'Пастрами',               cat:'meat',  kcal:130, p:22.0, f:4.0,  c:1.0},
  {id:'sausage',      name:'Сосиски',                cat:'meat',  kcal:266, p:10.4, f:24.0, c:1.6},
  {id:'sardelki',     name:'Сардельки',              cat:'meat',  kcal:332, p:10.0, f:31.0, c:1.8},
  {id:'bologna',      name:'Колбаса варёная',        cat:'meat',  kcal:257, p:12.8, f:22.2, c:1.5},
  {id:'servelat',     name:'Сервелат',               cat:'meat',  kcal:425, p:16.0, f:40.0, c:0},
  {id:'kupaty',       name:'Купаты',                 cat:'meat',  kcal:320, p:13.0, f:29.0, c:2.0},

  /* ===== РЫБА И МОРЕПРОДУКТЫ ===== */
  {id:'salmon',       name:'Лосось запечённый',      cat:'fish',  kcal:208, p:22.1, f:12.4, c:0},
  {id:'forel',        name:'Форель',                 cat:'fish',  kcal:97,  p:20.0, f:2.0,  c:0},
  {id:'gorbusha',     name:'Горбуша',                cat:'fish',  kcal:142, p:21.0, f:7.0,  c:0},
  {id:'skumbria',     name:'Скумбрия',               cat:'fish',  kcal:191, p:18.0, f:13.2, c:0},
  {id:'herring',      name:'Сельдь',                 cat:'fish',  kcal:217, p:17.0, f:19.0, c:0},
  {id:'cod',          name:'Треска',                 cat:'fish',  kcal:78,  p:17.7, f:0.7,  c:0},
  {id:'mintay',       name:'Минтай',                 cat:'fish',  kcal:72,  p:16.0, f:0.9,  c:0},
  {id:'tilapia',      name:'Тилапия',                cat:'fish',  kcal:96,  p:20.0, f:1.7,  c:0},
  {id:'sudak',        name:'Судак',                  cat:'fish',  kcal:84,  p:18.4, f:1.1,  c:0},
  {id:'okun',         name:'Окунь',                  cat:'fish',  kcal:82,  p:18.5, f:0.9,  c:0},
  {id:'karp',         name:'Карп',                   cat:'fish',  kcal:112, p:16.0, f:5.3,  c:0},
  {id:'tunasteak',    name:'Тунец свежий',           cat:'fish',  kcal:139, p:23.0, f:4.9,  c:0},
  {id:'tuna',         name:'Тунец консерв.',         cat:'fish',  kcal:96,  p:22.0, f:1.0,  c:0},
  {id:'sayra',        name:'Сайра консерв.',         cat:'fish',  kcal:283, p:18.0, f:23.0, c:0},
  {id:'shproty',      name:'Шпроты',                 cat:'fish',  kcal:363, p:17.0, f:32.0, c:0},
  {id:'shrimp',       name:'Креветки',               cat:'fish',  kcal:87,  p:18.3, f:1.2,  c:0},
  {id:'kalmar',       name:'Кальмар',                cat:'fish',  kcal:100, p:18.0, f:2.2,  c:2.0},
  {id:'midii',        name:'Мидии',                  cat:'fish',  kcal:77,  p:11.5, f:2.0,  c:3.3},
  {id:'krabpalki',    name:'Крабовые палочки',       cat:'fish',  kcal:88,  p:6.0,  f:1.0,  c:16.0},
  {id:'ikrakrasnaya', name:'Икра красная',           cat:'fish',  kcal:249, p:32.0, f:15.0, c:0},

  /* ===== КРУПЫ И ГАРНИРЫ ===== */
  {id:'buckwheat',    name:'Гречка отварная',        cat:'grain', kcal:110, p:4.2,  f:1.1,  c:21.3},
  {id:'rice',         name:'Рис отварной',           cat:'grain', kcal:116, p:2.2,  f:0.5,  c:24.9},
  {id:'brownrice',    name:'Рис бурый',              cat:'grain', kcal:111, p:2.6,  f:0.9,  c:23.0},
  {id:'oat',          name:'Овсянка на воде',        cat:'grain', kcal:88,  p:3.0,  f:1.7,  c:15.0},
  {id:'oatmilk',      name:'Овсянка на молоке',      cat:'grain', kcal:105, p:3.2,  f:4.1,  c:14.0},
  {id:'oatflakes',    name:'Овсяные хлопья сухие',   cat:'grain', kcal:366, p:11.9, f:7.2,  c:59.5},
  {id:'millet',       name:'Пшённая каша',           cat:'grain', kcal:90,  p:3.0,  f:0.7,  c:17.0},
  {id:'manka',        name:'Манная каша на воде',    cat:'grain', kcal:98,  p:2.5,  f:0.3,  c:16.8},
  {id:'kukuruznaya',  name:'Кукурузная каша',        cat:'grain', kcal:86,  p:2.4,  f:0.5,  c:17.0},
  {id:'yachnevaya',   name:'Ячневая каша',           cat:'grain', kcal:96,  p:2.3,  f:0.3,  c:19.8},
  {id:'pearlbarley',  name:'Перловка',               cat:'grain', kcal:106, p:3.0,  f:0.4,  c:22.2},
  {id:'bulgur',       name:'Булгур',                 cat:'grain', kcal:83,  p:3.0,  f:0.2,  c:18.6},
  {id:'quinoa',       name:'Киноа',                  cat:'grain', kcal:120, p:4.4,  f:1.9,  c:21.3},
  {id:'couscous',     name:'Кускус',                 cat:'grain', kcal:112, p:3.8,  f:0.2,  c:23.2},
  {id:'lentil',       name:'Чечевица отварная',      cat:'grain', kcal:111, p:9.0,  f:0.4,  c:20.0},
  {id:'beans',        name:'Фасоль отварная',        cat:'grain', kcal:123, p:7.8,  f:0.5,  c:21.5},
  {id:'chickpea',     name:'Нут отварной',           cat:'grain', kcal:164, p:8.9,  f:2.6,  c:27.0},
  {id:'peas',         name:'Горох отварной',         cat:'grain', kcal:60,  p:6.0,  f:0.6,  c:9.0},
  {id:'pasta',        name:'Макароны отварные',      cat:'grain', kcal:112, p:3.5,  f:0.4,  c:23.2},
  {id:'spaghetti',    name:'Спагетти отварные',      cat:'grain', kcal:158, p:5.8,  f:0.9,  c:30.9},
  {id:'noodles',      name:'Лапша яичная',           cat:'grain', kcal:138, p:4.5,  f:2.1,  c:25.0},
  {id:'lapsharis',    name:'Рисовая лапша',          cat:'grain', kcal:109, p:1.8,  f:0.2,  c:25.0},
  {id:'lapshagrech',  name:'Гречневая лапша',        cat:'grain', kcal:99,  p:3.5,  f:0.5,  c:21.0},
  {id:'potato',       name:'Картофель варёный',      cat:'grain', kcal:82,  p:2.0,  f:0.4,  c:16.7},
  {id:'kartofelpech', name:'Картофель печёный',      cat:'grain', kcal:90,  p:2.0,  f:0.1,  c:20.0},
  {id:'mashedpotato', name:'Картофельное пюре',      cat:'grain', kcal:106, p:2.2,  f:4.2,  c:14.7},
  {id:'friedpotato',  name:'Картофель жареный',      cat:'grain', kcal:192, p:2.8,  f:9.5,  c:23.4},
  {id:'batat',        name:'Батат',                  cat:'grain', kcal:86,  p:1.6,  f:0.1,  c:20.0},
  {id:'musli',        name:'Мюсли',                  cat:'grain', kcal:352, p:9.0,  f:9.0,  c:60.0},
  {id:'granola',      name:'Гранола',                cat:'grain', kcal:420, p:9.0,  f:16.0, c:60.0},
  {id:'kukhlopya',    name:'Кукурузные хлопья',      cat:'grain', kcal:325, p:6.5,  f:2.5,  c:70.0},
  {id:'otrubi',       name:'Отруби',                 cat:'grain', kcal:165, p:16.0, f:4.0,  c:22.0},

  /* ===== ХЛЕБ И ВЫПЕЧКА ===== */
  {id:'bread',        name:'Хлеб цельнозерновой',    cat:'bread', kcal:247, p:8.5,  f:3.3,  c:45.0},
  {id:'whitebread',   name:'Батон белый',            cat:'bread', kcal:264, p:7.5,  f:2.9,  c:50.9},
  {id:'rzhanoy',      name:'Хлеб ржаной',            cat:'bread', kcal:174, p:6.6,  f:1.2,  c:33.4},
  {id:'borodinsky',   name:'Хлеб бородинский',       cat:'bread', kcal:208, p:6.8,  f:1.3,  c:40.7},
  {id:'lavash',       name:'Лаваш тонкий',           cat:'bread', kcal:236, p:7.9,  f:1.0,  c:47.6},
  {id:'baget',        name:'Багет',                  cat:'bread', kcal:262, p:7.5,  f:1.5,  c:54.0},
  {id:'pita',         name:'Пита',                   cat:'bread', kcal:275, p:9.0,  f:1.2,  c:55.0},
  {id:'tortilla',     name:'Тортилья',               cat:'bread', kcal:310, p:8.0,  f:8.0,  c:50.0},
  {id:'hlebtsy',      name:'Хлебцы',                 cat:'bread', kcal:300, p:9.0,  f:2.0,  c:60.0},
  {id:'suhari',       name:'Сухари',                 cat:'bread', kcal:335, p:11.0, f:2.0,  c:72.0},
  {id:'bulochka',     name:'Булочка сдобная',        cat:'bread', kcal:300, p:7.9,  f:6.0,  c:54.0},
  {id:'bagel',        name:'Бублик',                 cat:'bread', kcal:250, p:9.0,  f:1.5,  c:50.0},
  {id:'croissant',    name:'Круассан',               cat:'bread', kcal:406, p:8.2,  f:21.0, c:45.8},
  {id:'vatrushka',    name:'Ватрушка',               cat:'bread', kcal:290, p:8.0,  f:9.0,  c:45.0},
  {id:'ponchik',      name:'Пончик',                 cat:'bread', kcal:296, p:5.0,  f:15.0, c:38.0},
  {id:'keks',         name:'Кекс',                   cat:'bread', kcal:380, p:6.0,  f:18.0, c:50.0},
  {id:'pirogyabl',    name:'Пирог с яблоками',       cat:'bread', kcal:270, p:6.0,  f:10.0, c:40.0},
  {id:'pancake',      name:'Блины',                  cat:'bread', kcal:233, p:6.1,  f:12.3, c:26.0},
  {id:'oladi',        name:'Оладьи',                 cat:'bread', kcal:245, p:6.5,  f:10.0, c:32.0},

  /* ===== МОЛОЧНОЕ И ЯЙЦА ===== */
  {id:'milk',         name:'Молоко 2.5%',            cat:'dairy', kcal:52,  p:2.8,  f:2.5,  c:4.7},
  {id:'milk32',       name:'Молоко 3.2%',            cat:'dairy', kcal:60,  p:2.9,  f:3.2,  c:4.7},
  {id:'kefir',        name:'Кефир 1%',               cat:'dairy', kcal:40,  p:3.0,  f:1.0,  c:4.0},
  {id:'ryazhenka',    name:'Ряженка',                cat:'dairy', kcal:54,  p:2.9,  f:2.5,  c:4.2},
  {id:'prostokvasha', name:'Простокваша',            cat:'dairy', kcal:58,  p:2.9,  f:3.2,  c:4.1},
  {id:'ayran',        name:'Айран',                  cat:'dairy', kcal:27,  p:1.1,  f:1.5,  c:1.6},
  {id:'yogurt',       name:'Йогурт натуральный',     cat:'dairy', kcal:66,  p:5.0,  f:3.2,  c:4.0},
  {id:'drinkyogurt',  name:'Йогурт питьевой',        cat:'dairy', kcal:68,  p:2.8,  f:1.5,  c:11.0},
  {id:'cottage',      name:'Творог 5%',              cat:'dairy', kcal:121, p:17.2, f:5.0,  c:1.8},
  {id:'cottage9',     name:'Творог 9%',              cat:'dairy', kcal:159, p:16.7, f:9.0,  c:2.0},
  {id:'cottage0',     name:'Творог обезжиренный',    cat:'dairy', kcal:71,  p:16.5, f:0.6,  c:1.3},
  {id:'tvorogmassa',  name:'Творожная масса',        cat:'dairy', kcal:340, p:7.1,  f:23.0, c:27.0},
  {id:'syrniki',      name:'Сырники',                cat:'dairy', kcal:220, p:17.0, f:11.0, c:18.0},
  {id:'glazedcurd',   name:'Сырок глазированный',    cat:'dairy', kcal:407, p:8.5,  f:27.8, c:32.0},
  {id:'sourcream',    name:'Сметана 20%',            cat:'dairy', kcal:206, p:2.6,  f:20.0, c:3.2},
  {id:'smetana10',    name:'Сметана 10%',            cat:'dairy', kcal:116, p:3.0,  f:10.0, c:2.9},
  {id:'slivki10',     name:'Сливки 10%',             cat:'dairy', kcal:118, p:3.0,  f:10.0, c:4.0},
  {id:'slivki20',     name:'Сливки 20%',             cat:'dairy', kcal:206, p:2.8,  f:20.0, c:3.7},
  {id:'slivki33',     name:'Сливки 33%',             cat:'dairy', kcal:322, p:2.5,  f:33.0, c:3.0},
  {id:'cheese',       name:'Сыр полутвёрдый',        cat:'dairy', kcal:356, p:25.0, f:28.0, c:0},
  {id:'parmesan',     name:'Пармезан',               cat:'dairy', kcal:392, p:36.0, f:26.0, c:4.0},
  {id:'mozzarella',   name:'Моцарелла',              cat:'dairy', kcal:280, p:22.0, f:22.0, c:2.0},
  {id:'brynza',       name:'Брынза',                 cat:'dairy', kcal:260, p:17.0, f:20.0, c:0},
  {id:'adygeisky',    name:'Адыгейский сыр',         cat:'dairy', kcal:240, p:19.0, f:19.0, c:1.5},
  {id:'suluguni',     name:'Сулугуни',               cat:'dairy', kcal:286, p:20.0, f:22.0, c:0},
  {id:'feta',         name:'Фета',                   cat:'dairy', kcal:264, p:14.0, f:21.0, c:4.0},
  {id:'meltcheese',   name:'Сыр плавленый',          cat:'dairy', kcal:257, p:12.0, f:22.0, c:3.0},
  {id:'tvorozhnysyr', name:'Творожный сыр',          cat:'dairy', kcal:250, p:5.0,  f:24.0, c:4.0},
  {id:'mascarpone',   name:'Маскарпоне',             cat:'dairy', kcal:412, p:4.8,  f:41.0, c:4.8},
  {id:'butter',       name:'Масло сливочное',        cat:'dairy', kcal:748, p:0.5,  f:82.5, c:0.8},
  {id:'egg',          name:'Яйцо куриное',           cat:'dairy', kcal:157, p:12.7, f:11.5, c:0.7},
  {id:'belok',        name:'Яичный белок',           cat:'dairy', kcal:44,  p:11.1, f:0,    c:0},
  {id:'zheltok',      name:'Яичный желток',          cat:'dairy', kcal:352, p:16.2, f:31.2, c:1.0},
  {id:'yaicoperep',   name:'Перепелиное яйцо',       cat:'dairy', kcal:168, p:11.9, f:13.1, c:0.6},
  {id:'molokosoy',    name:'Соевое молоко',          cat:'dairy', kcal:54,  p:3.3,  f:1.8,  c:6.0},
  {id:'molokooves',   name:'Овсяное молоко',         cat:'dairy', kcal:45,  p:1.0,  f:1.5,  c:7.0},
  {id:'molokomind',   name:'Миндальное молоко',      cat:'dairy', kcal:22,  p:0.5,  f:1.6,  c:1.5},

  /* ===== ОВОЩИ И ГРИБЫ ===== */
  {id:'cucumber',     name:'Огурец',                 cat:'veg',   kcal:15,  p:0.8,  f:0.1,  c:2.5},
  {id:'kornishony',   name:'Огурцы солёные',         cat:'veg',   kcal:16,  p:0.8,  f:0.1,  c:2.9},
  {id:'tomatofresh',  name:'Помидор',                cat:'veg',   kcal:20,  p:1.1,  f:0.2,  c:3.7},
  {id:'tomatsol',     name:'Помидоры солёные',       cat:'veg',   kcal:20,  p:1.1,  f:0.1,  c:3.5},
  {id:'cabbage',      name:'Капуста белокочанная',   cat:'veg',   kcal:28,  p:1.8,  f:0.1,  c:4.7},
  {id:'sauerkraut',   name:'Квашеная капуста',       cat:'veg',   kcal:19,  p:1.8,  f:0.1,  c:3.0},
  {id:'kapustatush',  name:'Капуста тушёная',        cat:'veg',   kcal:40,  p:2.0,  f:2.0,  c:4.0},
  {id:'tsvetnaya',    name:'Цветная капуста',        cat:'veg',   kcal:30,  p:2.5,  f:0.3,  c:4.2},
  {id:'brussel',      name:'Брюссельская капуста',   cat:'veg',   kcal:43,  p:3.4,  f:0.3,  c:9.0},
  {id:'broccoli',     name:'Брокколи',               cat:'veg',   kcal:34,  p:2.8,  f:0.4,  c:6.6},
  {id:'carrot',       name:'Морковь',                cat:'veg',   kcal:35,  p:1.3,  f:0.1,  c:6.9},
  {id:'morkovkor',    name:'Морковь по-корейски',    cat:'veg',   kcal:134, p:1.0,  f:9.0,  c:12.0},
  {id:'beet',         name:'Свёкла',                 cat:'veg',   kcal:42,  p:1.5,  f:0.1,  c:8.8},
  {id:'onion',        name:'Лук репчатый',           cat:'veg',   kcal:41,  p:1.4,  f:0,    c:8.2},
  {id:'chesnok',      name:'Чеснок',                 cat:'veg',   kcal:143, p:6.5,  f:0.5,  c:29.9},
  {id:'imbir',        name:'Имбирь',                 cat:'veg',   kcal:80,  p:1.8,  f:0.8,  c:15.8},
  {id:'zucchini',     name:'Кабачок',                cat:'veg',   kcal:24,  p:0.6,  f:0.3,  c:4.6},
  {id:'kabachikra',   name:'Кабачковая икра',        cat:'veg',   kcal:97,  p:1.2,  f:7.0,  c:8.5},
  {id:'eggplant',     name:'Баклажан',               cat:'veg',   kcal:24,  p:1.2,  f:0.1,  c:4.5},
  {id:'bellpepper',   name:'Перец болгарский',       cat:'veg',   kcal:27,  p:1.3,  f:0,    c:5.3},
  {id:'tykva',        name:'Тыква',                  cat:'veg',   kcal:22,  p:1.0,  f:0.1,  c:4.4},
  {id:'redis',        name:'Редис',                  cat:'veg',   kcal:19,  p:1.2,  f:0.1,  c:3.4},
  {id:'redka',        name:'Редька',                 cat:'veg',   kcal:36,  p:1.9,  f:0.2,  c:6.7},
  {id:'repa',         name:'Репа',                   cat:'veg',   kcal:32,  p:1.5,  f:0.1,  c:6.2},
  {id:'sparzha',      name:'Спаржа',                 cat:'veg',   kcal:21,  p:1.9,  f:0.1,  c:3.1},
  {id:'fasolstr',     name:'Стручковая фасоль',      cat:'veg',   kcal:24,  p:2.0,  f:0.2,  c:3.6},
  {id:'greenpeas',    name:'Зелёный горошек',        cat:'veg',   kcal:73,  p:5.0,  f:0.2,  c:12.8},
  {id:'corn',         name:'Кукуруза консерв.',      cat:'veg',   kcal:58,  p:2.2,  f:0.4,  c:11.2},
  {id:'kukuruzavar',  name:'Кукуруза варёная',       cat:'veg',   kcal:108, p:3.6,  f:1.5,  c:22.5},
  {id:'lettuce',      name:'Салат листовой',         cat:'veg',   kcal:15,  p:1.4,  f:0.2,  c:2.2},
  {id:'rukola',       name:'Руккола',                cat:'veg',   kcal:25,  p:2.6,  f:0.7,  c:2.1},
  {id:'shpinat',      name:'Шпинат',                 cat:'veg',   kcal:23,  p:2.9,  f:0.4,  c:2.0},
  {id:'ukrop',        name:'Укроп',                  cat:'veg',   kcal:38,  p:2.5,  f:0.5,  c:6.3},
  {id:'petrushka',    name:'Петрушка',               cat:'veg',   kcal:47,  p:3.7,  f:0.4,  c:7.6},
  {id:'selderey',     name:'Сельдерей',              cat:'veg',   kcal:13,  p:0.9,  f:0.1,  c:2.1},
  {id:'mushroom',     name:'Шампиньоны',             cat:'veg',   kcal:22,  p:4.3,  f:1.0,  c:0.1},
  {id:'veshenki',     name:'Вешенки',                cat:'veg',   kcal:38,  p:2.5,  f:0.5,  c:6.5},
  {id:'gribyles',     name:'Белые грибы',            cat:'veg',   kcal:34,  p:3.7,  f:1.7,  c:1.1},
  {id:'olivki',       name:'Оливки',                 cat:'veg',   kcal:115, p:0.8,  f:10.7, c:6.3},
  {id:'maslin',       name:'Маслины',                cat:'veg',   kcal:175, p:2.2,  f:16.3, c:5.2},
  {id:'ovoshigril',   name:'Овощи гриль',            cat:'veg',   kcal:60,  p:1.5,  f:3.0,  c:7.0},

  /* ===== ФРУКТЫ И ЯГОДЫ ===== */
  {id:'apple',        name:'Яблоко',                 cat:'fruit', kcal:52,  p:0.4,  f:0.4,  c:11.8},
  {id:'banana',       name:'Банан',                  cat:'fruit', kcal:96,  p:1.5,  f:0.2,  c:21.8},
  {id:'orange',       name:'Апельсин',               cat:'fruit', kcal:43,  p:0.9,  f:0.2,  c:8.1},
  {id:'mandarin',     name:'Мандарин',               cat:'fruit', kcal:38,  p:0.8,  f:0.2,  c:7.5},
  {id:'grapefruit',   name:'Грейпфрут',              cat:'fruit', kcal:35,  p:0.7,  f:0.2,  c:6.5},
  {id:'limon',        name:'Лимон',                  cat:'fruit', kcal:34,  p:0.9,  f:0.1,  c:3.0},
  {id:'pear',         name:'Груша',                  cat:'fruit', kcal:47,  p:0.4,  f:0.3,  c:10.9},
  {id:'sliva',        name:'Слива',                  cat:'fruit', kcal:42,  p:0.8,  f:0.3,  c:9.6},
  {id:'abrikos',      name:'Абрикос',                cat:'fruit', kcal:44,  p:0.9,  f:0.1,  c:9.0},
  {id:'peach',        name:'Персик',                 cat:'fruit', kcal:39,  p:0.9,  f:0.1,  c:9.5},
  {id:'grape',        name:'Виноград',               cat:'fruit', kcal:65,  p:0.6,  f:0.2,  c:16.8},
  {id:'kiwi',         name:'Киви',                   cat:'fruit', kcal:47,  p:0.8,  f:0.4,  c:10.3},
  {id:'ananas',       name:'Ананас',                 cat:'fruit', kcal:49,  p:0.4,  f:0.2,  c:10.6},
  {id:'mango',        name:'Манго',                  cat:'fruit', kcal:67,  p:0.5,  f:0.3,  c:15.0},
  {id:'granat',       name:'Гранат',                 cat:'fruit', kcal:72,  p:0.9,  f:0.6,  c:14.5},
  {id:'hurma',        name:'Хурма',                  cat:'fruit', kcal:67,  p:0.5,  f:0.4,  c:15.3},
  {id:'watermelon',   name:'Арбуз',                  cat:'fruit', kcal:27,  p:0.6,  f:0.1,  c:5.8},
  {id:'dynya',        name:'Дыня',                   cat:'fruit', kcal:35,  p:0.6,  f:0.3,  c:7.4},
  {id:'avocado',      name:'Авокадо',                cat:'fruit', kcal:160, p:2.0,  f:14.7, c:8.5},
  {id:'berries',      name:'Ягоды свежие',           cat:'fruit', kcal:46,  p:0.8,  f:0.4,  c:9.6},
  {id:'klubnika',     name:'Клубника',               cat:'fruit', kcal:41,  p:0.8,  f:0.4,  c:7.5},
  {id:'malina',       name:'Малина',                 cat:'fruit', kcal:46,  p:0.8,  f:0.5,  c:8.3},
  {id:'chernika',     name:'Черника',                cat:'fruit', kcal:44,  p:1.1,  f:0.6,  c:7.6},
  {id:'golubika',     name:'Голубика',               cat:'fruit', kcal:39,  p:1.0,  f:0.5,  c:6.6},
  {id:'smorodina',    name:'Смородина',              cat:'fruit', kcal:43,  p:1.0,  f:0.4,  c:7.3},
  {id:'vishnya',      name:'Вишня',                  cat:'fruit', kcal:52,  p:0.8,  f:0.5,  c:10.6},
  {id:'chereshnya',   name:'Черешня',                cat:'fruit', kcal:52,  p:1.1,  f:0.4,  c:10.6},
  {id:'klukva',       name:'Клюква',                 cat:'fruit', kcal:26,  p:0.5,  f:0.2,  c:3.7},
  {id:'oblepiha',     name:'Облепиха',               cat:'fruit', kcal:82,  p:1.2,  f:5.4,  c:5.7},
  {id:'raisin',       name:'Изюм',                   cat:'fruit', kcal:264, p:2.9,  f:0.6,  c:66.0},
  {id:'driedapricot', name:'Курага',                 cat:'fruit', kcal:232, p:5.2,  f:0.3,  c:51.0},
  {id:'prune',        name:'Чернослив',              cat:'fruit', kcal:231, p:2.3,  f:0.7,  c:57.5},
  {id:'dates',        name:'Финики',                 cat:'fruit', kcal:292, p:2.5,  f:0.5,  c:69.2},
  {id:'inzhir',       name:'Инжир сушёный',          cat:'fruit', kcal:257, p:3.1,  f:0.8,  c:57.9},

  /* ===== ОРЕХИ И СЕМЕНА ===== */
  {id:'walnut',       name:'Грецкий орех',           cat:'nuts',  kcal:654, p:15.2, f:65.2, c:7.0},
  {id:'almond',       name:'Миндаль',                cat:'nuts',  kcal:609, p:18.6, f:53.7, c:13.0},
  {id:'cashew',       name:'Кешью',                  cat:'nuts',  kcal:553, p:18.2, f:43.8, c:30.2},
  {id:'hazelnut',     name:'Фундук',                 cat:'nuts',  kcal:628, p:15.0, f:61.0, c:16.7},
  {id:'fistashki',    name:'Фисташки',               cat:'nuts',  kcal:560, p:20.0, f:45.0, c:28.0},
  {id:'brazil',       name:'Бразильский орех',       cat:'nuts',  kcal:656, p:14.0, f:66.0, c:12.0},
  {id:'makadamia',    name:'Макадамия',              cat:'nuts',  kcal:718, p:8.0,  f:76.0, c:14.0},
  {id:'kedrovy',      name:'Кедровый орех',          cat:'nuts',  kcal:673, p:13.7, f:68.4, c:13.1},
  {id:'peanut',       name:'Арахис',                 cat:'nuts',  kcal:567, p:26.0, f:49.0, c:16.0},
  {id:'peanutbutter', name:'Арахисовая паста',       cat:'nuts',  kcal:588, p:25.0, f:50.0, c:20.0},
  {id:'sunflowerseed',name:'Семечки подсолнечника',  cat:'nuts',  kcal:601, p:20.7, f:52.9, c:10.5},
  {id:'tykvsemechki', name:'Тыквенные семечки',      cat:'nuts',  kcal:559, p:30.0, f:49.0, c:11.0},
  {id:'kunzhut',      name:'Кунжут',                 cat:'nuts',  kcal:573, p:17.7, f:49.7, c:23.4},
  {id:'chia',         name:'Семена чиа',             cat:'nuts',  kcal:486, p:16.5, f:30.7, c:42.0},
  {id:'len',          name:'Семена льна',            cat:'nuts',  kcal:534, p:18.3, f:42.2, c:28.9},
  {id:'kokosstruzh',  name:'Кокосовая стружка',      cat:'nuts',  kcal:592, p:6.9,  f:62.0, c:5.0},

  /* ===== МАСЛА И СОУСЫ ===== */
  {id:'oliveoil',     name:'Масло оливковое',        cat:'fat',   kcal:884, p:0,    f:100,  c:0},
  {id:'sunfloweroil', name:'Масло подсолнечное',     cat:'fat',   kcal:899, p:0,    f:99.9, c:0},
  {id:'kokosoil',     name:'Масло кокосовое',        cat:'fat',   kcal:862, p:0,    f:99.9, c:0},
  {id:'lenoil',       name:'Масло льняное',          cat:'fat',   kcal:898, p:0,    f:99.8, c:0},
  {id:'margarin',     name:'Маргарин',               cat:'fat',   kcal:743, p:0.5,  f:82.0, c:1.0},
  {id:'mayonez',      name:'Майонез',                cat:'fat',   kcal:627, p:0.3,  f:67.0, c:2.6},
  {id:'mayonezleg',   name:'Майонез лёгкий',         cat:'fat',   kcal:300, p:0.5,  f:30.0, c:5.0},
  {id:'ketchup',      name:'Кетчуп',                 cat:'fat',   kcal:93,  p:1.8,  f:0.5,  c:21.4},
  {id:'tomato',       name:'Соус томатный',          cat:'fat',   kcal:62,  p:1.5,  f:2.5,  c:8.0},
  {id:'gorchitsa',    name:'Горчица',                cat:'fat',   kcal:143, p:9.9,  f:12.7, c:5.3},
  {id:'hren',         name:'Хрен',                   cat:'fat',   kcal:63,  p:3.2,  f:0.4,  c:10.5},
  {id:'adjika',       name:'Аджика',                 cat:'fat',   kcal:59,  p:1.0,  f:3.7,  c:5.8},
  {id:'soevysous',    name:'Соевый соус',            cat:'fat',   kcal:50,  p:6.0,  f:0,    c:6.0},
  {id:'soussyrny',    name:'Сырный соус',            cat:'fat',   kcal:420, p:3.0,  f:44.0, c:3.0},
  {id:'souschesnok',  name:'Чесночный соус',         cat:'fat',   kcal:400, p:2.0,  f:42.0, c:4.0},
  {id:'sousbbq',      name:'Соус барбекю',           cat:'fat',   kcal:172, p:1.0,  f:0.5,  c:40.0},
  {id:'pesto',        name:'Соус песто',             cat:'fat',   kcal:450, p:4.0,  f:45.0, c:6.0},
  {id:'tahini',       name:'Тахини',                 cat:'fat',   kcal:595, p:17.0, f:53.0, c:21.0},
  {id:'hummus',       name:'Хумус',                  cat:'fat',   kcal:166, p:7.9,  f:9.6,  c:14.3},

  /* ===== СЛАДКОЕ И СНЕКИ ===== */
  {id:'milkchoc',     name:'Шоколад молочный',       cat:'sweet', kcal:535, p:6.9,  f:29.7, c:59.4},
  {id:'darkchoc',     name:'Шоколад тёмный',         cat:'sweet', kcal:546, p:6.2,  f:35.4, c:48.2},
  {id:'shokobaton',   name:'Шоколадный батончик',    cat:'sweet', kcal:500, p:6.0,  f:25.0, c:60.0},
  {id:'konfety',      name:'Конфеты шоколадные',     cat:'sweet', kcal:450, p:4.0,  f:22.0, c:60.0},
  {id:'karamel',      name:'Карамель',               cat:'sweet', kcal:380, p:0,    f:0,    c:95.0},
  {id:'cookie',       name:'Печенье',                cat:'sweet', kcal:417, p:7.5,  f:11.8, c:74.4},
  {id:'pechenieovs',  name:'Овсяное печенье',        cat:'sweet', kcal:437, p:6.0,  f:16.0, c:68.0},
  {id:'vafli',        name:'Вафли',                  cat:'sweet', kcal:430, p:6.0,  f:22.0, c:54.0},
  {id:'gingerbread',  name:'Пряник',                 cat:'sweet', kcal:364, p:4.8,  f:2.8,  c:77.0},
  {id:'marshmallow',  name:'Зефир',                  cat:'sweet', kcal:326, p:0.8,  f:0.1,  c:79.8},
  {id:'marmelad',     name:'Мармелад',               cat:'sweet', kcal:306, p:0.4,  f:0.1,  c:76.0},
  {id:'pastila',      name:'Пастила',                cat:'sweet', kcal:310, p:0.5,  f:0,    c:80.0},
  {id:'halva',        name:'Халва',                  cat:'sweet', kcal:523, p:11.6, f:29.7, c:54.0},
  {id:'pahlava',      name:'Пахлава',                cat:'sweet', kcal:400, p:6.0,  f:20.0, c:50.0},
  {id:'tort',         name:'Торт бисквитный',        cat:'sweet', kcal:350, p:4.5,  f:18.0, c:45.0},
  {id:'tortnapoleon', name:'Торт Наполеон',          cat:'sweet', kcal:400, p:5.0,  f:25.0, c:40.0},
  {id:'cheesecake',   name:'Чизкейк',                cat:'sweet', kcal:320, p:6.0,  f:20.0, c:30.0},
  {id:'pirozhnoe',    name:'Пирожное',               cat:'sweet', kcal:380, p:5.0,  f:20.0, c:45.0},
  {id:'ekler',        name:'Эклер',                  cat:'sweet', kcal:320, p:6.0,  f:18.0, c:35.0},
  {id:'icecream',     name:'Мороженое пломбир',      cat:'sweet', kcal:207, p:3.7,  f:11.0, c:23.2},
  {id:'sorbet',       name:'Сорбет',                 cat:'sweet', kcal:130, p:0.5,  f:0,    c:32.0},
  {id:'sguschenka',   name:'Сгущёнка',               cat:'sweet', kcal:320, p:7.2,  f:8.5,  c:56.0},
  {id:'nutella',      name:'Шоколадная паста',       cat:'sweet', kcal:539, p:6.3,  f:30.9, c:57.5},
  {id:'jam',          name:'Варенье',                cat:'sweet', kcal:271, p:0.3,  f:0.1,  c:68.0},
  {id:'honey',        name:'Мёд',                    cat:'sweet', kcal:329, p:0.8,  f:0,    c:81.5},
  {id:'sugar',        name:'Сахар',                  cat:'sweet', kcal:399, p:0,    f:0,    c:99.8},
  {id:'chipsy',       name:'Чипсы',                  cat:'sweet', kcal:536, p:6.5,  f:34.0, c:50.0},
  {id:'suhariki',     name:'Сухарики',               cat:'sweet', kcal:400, p:10.0, f:10.0, c:68.0},
  {id:'krekers',      name:'Крекеры',                cat:'sweet', kcal:400, p:9.0,  f:12.0, c:65.0},
  {id:'popcorn',      name:'Попкорн',                cat:'sweet', kcal:375, p:11.0, f:13.0, c:57.0},
  {id:'muslibar',     name:'Мюсли-батончик',         cat:'sweet', kcal:400, p:6.0,  f:14.0, c:62.0},

  /* ===== НАПИТКИ ===== */
  {id:'coffee',       name:'Кофе чёрный',            cat:'drink', kcal:2,   p:0.2,  f:0,    c:0.3},
  {id:'coffeemilk',   name:'Кофе с молоком',         cat:'drink', kcal:42,  p:2.0,  f:2.0,  c:4.0},
  {id:'latte',        name:'Латте',                  cat:'drink', kcal:55,  p:3.0,  f:2.5,  c:5.0},
  {id:'kapuchino',    name:'Капучино',               cat:'drink', kcal:50,  p:2.7,  f:2.3,  c:4.5},
  {id:'kakao',        name:'Какао на молоке',        cat:'drink', kcal:85,  p:3.5,  f:3.8,  c:9.0},
  {id:'tea',          name:'Чай без сахара',         cat:'drink', kcal:1,   p:0,    f:0,    c:0.2},
  {id:'chaysahar',    name:'Чай с сахаром',          cat:'drink', kcal:28,  p:0,    f:0,    c:7.0},
  {id:'voda',         name:'Вода',                   cat:'drink', kcal:0,   p:0,    f:0,    c:0},
  {id:'orangejuice',  name:'Сок апельсиновый',       cat:'drink', kcal:45,  p:0.7,  f:0.1,  c:10.4},
  {id:'sokyablo',     name:'Сок яблочный',           cat:'drink', kcal:46,  p:0.5,  f:0.1,  c:11.0},
  {id:'soktomat',     name:'Сок томатный',           cat:'drink', kcal:21,  p:1.0,  f:0.2,  c:3.5},
  {id:'smoothie',     name:'Смузи',                  cat:'drink', kcal:60,  p:1.0,  f:0.3,  c:14.0},
  {id:'compote',      name:'Компот',                 cat:'drink', kcal:60,  p:0.1,  f:0,    c:15.0},
  {id:'mors',         name:'Морс',                   cat:'drink', kcal:41,  p:0,    f:0,    c:10.0},
  {id:'kisel',        name:'Кисель',                 cat:'drink', kcal:53,  p:0.1,  f:0,    c:13.0},
  {id:'kvas',         name:'Квас',                   cat:'drink', kcal:27,  p:0.2,  f:0,    c:5.2},
  {id:'cola',         name:'Кола',                   cat:'drink', kcal:42,  p:0,    f:0,    c:10.6},
  {id:'limonad',      name:'Лимонад',                cat:'drink', kcal:40,  p:0,    f:0,    c:10.0},
  {id:'energetik',    name:'Энергетик',              cat:'drink', kcal:45,  p:0,    f:0,    c:11.0},
  {id:'beer',         name:'Пиво светлое',           cat:'drink', kcal:43,  p:0.6,  f:0,    c:3.6},
  {id:'pivotemnoe',   name:'Пиво тёмное',            cat:'drink', kcal:48,  p:0.6,  f:0,    c:5.7},
  {id:'winedry',      name:'Вино сухое',             cat:'drink', kcal:68,  p:0.2,  f:0,    c:0.3},
  {id:'vinosladkoe',  name:'Вино сладкое',           cat:'drink', kcal:100, p:0.2,  f:0,    c:8.0},
  {id:'shampanskoe',  name:'Шампанское',             cat:'drink', kcal:88,  p:0.2,  f:0,    c:5.0},
  {id:'vodka',        name:'Водка',                  cat:'drink', kcal:235, p:0,    f:0,    c:0.1},
  {id:'viski',        name:'Виски',                  cat:'drink', kcal:220, p:0,    f:0,    c:0},
  {id:'konyak',       name:'Коньяк',                 cat:'drink', kcal:240, p:0,    f:0,    c:1.5},

  /* ===== СПОРТПИТ ===== */
  {id:'protein',      name:'Протеин (порошок)',      cat:'sport', kcal:373, p:75.0, f:5.0,  c:8.0},
  {id:'izolyat',      name:'Изолят протеина',        cat:'sport', kcal:373, p:85.0, f:1.0,  c:3.0},
  {id:'kazein',       name:'Казеин',                 cat:'sport', kcal:360, p:75.0, f:3.0,  c:5.0},
  {id:'gainer',       name:'Гейнер',                 cat:'sport', kcal:380, p:15.0, f:4.0,  c:75.0},
  {id:'protshake',    name:'Протеиновый коктейль',   cat:'sport', kcal:60,  p:10.0, f:1.0,  c:3.0},
  {id:'proteinbar',   name:'Протеиновый батончик',   cat:'sport', kcal:350, p:30.0, f:10.0, c:35.0},
  {id:'bcaa',         name:'BCAA',                   cat:'sport', kcal:20,  p:5.0,  f:0,    c:0},
  {id:'kreatin',      name:'Креатин',                cat:'sport', kcal:0,   p:0,    f:0,    c:0},
  {id:'omega3',       name:'Рыбий жир',              cat:'sport', kcal:900, p:0,    f:100,  c:0},
];
const FOOD_BY_ID = Object.fromEntries(FOODS.map(f=>[f.id,f]));

/* Поиск по-русски: «курица» должна находить «Куриная грудка».
   Полноценная морфология тут избыточна — хватает отсечения окончаний. */
const stem = w => w.toLowerCase().replace(/ё/g,'е')
  .replace(/(ями|ами|иями|ого|его|ыми|ими|ая|яя|ые|ие|ой|ей|ом|ем|ах|ях|ов|ев|ы|и|а|я|у|ю|е|о)$/,'');

/* Подбор продукта из базы по свободному названию — для распознавания по фото.
   Побеждает тот, у кого больше совпавших слов; при равенстве — более короткое название. */
function findFoodByName(name){
  if(!name) return null;
  const q = String(name).toLowerCase().trim();
  const exact = FOODS.find(f => f.name.toLowerCase() === q);
  if(exact) return exact;

  /* Требуем совпадения всех слов запроса. Свободное совпадение по одному слову
     пробовали — оно ловит ложные корни: «Гречка» уходила в «Греческий салат»,
     «Грибы жареные» в «Грибной суп». Лучше не найти, чем найти не то. */
  const qs = q.split(/[\s,.()\-–]+/).filter(Boolean).map(stem);
  let best = null, bestScore = 0;
  for(const f of FOODS){
    if(!foodMatches(f.name, q)) continue;
    const ws = f.name.toLowerCase().split(/[\s,.()\-–]+/).filter(Boolean).map(stem);
    const score = qs.filter(t => ws.some(w => w.startsWith(t) || t.startsWith(w))).length;
    if(score > bestScore || (score === bestScore && best && f.name.length < best.name.length)){
      best = f; bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function foodMatches(name, query){
  const qs = query.split(/[\s,]+/).filter(Boolean).map(stem);
  const ws = name.split(/[\s,.()\-–]+/).filter(Boolean).map(stem);
  return qs.every(t => t.length >= 2 && ws.some(w =>
    w.startsWith(t)
    || (t.startsWith(w) && w.length >= 3)
    /* «курица» и «куриная» дают разные основы — спасает общий корень */
    || (t.length >= 4 && w.length >= 4 && t.slice(0,4) === w.slice(0,4))));
}


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
