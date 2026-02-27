export type NewsCategory = "transfer" | "injury" | "match" | "preview" | "analysis" | "general";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  /** Match against team names, full/short athlete names, or league names */
  tags: string[];
}

const H = 3_600_000;
const D = 86_400_000;
const t = (offset: number) => new Date(Date.now() - offset).toISOString();

export const SAMPLE_NEWS: NewsItem[] = [

  // ── Arsenal ───────────────────────────────────────────────────────────────
  {
    id: "n-001",
    headline: "Saka extends Arsenal contract through 2028 in landmark deal",
    summary: "Bukayo Saka has committed his future to Arsenal until 2028, ending months of speculation over his long-term future at the club. The winger has contributed 14 goals and 11 assists in a stellar campaign.",
    source: "BBC Sport",
    publishedAt: t(2 * H),
    category: "transfer",
    tags: ["Arsenal", "Premier League"],
  },
  {
    id: "n-002",
    headline: "Arteta backs Rice to be the best midfielder in Europe",
    summary: "Mikel Arteta has heaped praise on Declan Rice, saying the England midfielder has the potential to be the best in Europe. Rice has been instrumental in Arsenal's title push with eight assists and an imposing defensive record.",
    source: "The Athletic",
    publishedAt: t(8 * H),
    category: "analysis",
    tags: ["Arsenal", "Premier League"],
  },
  {
    id: "n-003",
    headline: "Arsenal injury update: Martinelli doubtful for weekend clash",
    summary: "Arsenal manager Mikel Arteta confirmed Gabriel Martinelli has picked up a hamstring complaint in training and faces a late fitness test ahead of the Premier League fixture this weekend.",
    source: "Sky Sports",
    publishedAt: t(14 * H),
    category: "injury",
    tags: ["Arsenal", "Premier League"],
  },
  {
    id: "n-004",
    headline: "Arsenal eye Bundesliga midfielder in summer window",
    summary: "Arsenal scouts have been tracking a top Bundesliga midfielder as the club looks to add depth ahead of next season. The Gunners are preparing a £60m bid should they qualify for the Champions League.",
    source: "The Athletic",
    publishedAt: t(2 * D),
    category: "transfer",
    tags: ["Arsenal", "Premier League"],
  },

  // ── Chelsea ───────────────────────────────────────────────────────────────
  {
    id: "n-005",
    headline: "Palmer's stunning form making Chelsea title-race believers",
    summary: "Cole Palmer has been the creative heartbeat of Chelsea's resurgent campaign. With 18 goals and 11 assists, the England international has silenced critics who questioned the club's £40m outlay last summer.",
    source: "Sky Sports",
    publishedAt: t(3 * H),
    category: "analysis",
    tags: ["Chelsea", "Premier League"],
  },
  {
    id: "n-006",
    headline: "Chelsea confirm key defender ruled out for six weeks",
    summary: "Chelsea have confirmed that a key central defender suffered a knee ligament injury in training and will be sidelined for approximately six weeks, dealing a significant blow to their defensive options.",
    source: "BBC Sport",
    publishedAt: t(1 * D),
    category: "injury",
    tags: ["Chelsea", "Premier League"],
  },
  {
    id: "n-007",
    headline: "Maresca targets two signings in January to shore up midfield",
    summary: "Chelsea boss Enzo Maresca has outlined plans to bring in midfield reinforcements in January as the Blues look to maintain their push for a top-four finish.",
    source: "ESPN",
    publishedAt: t(3 * D),
    category: "transfer",
    tags: ["Chelsea", "Premier League"],
  },

  // ── Man City ──────────────────────────────────────────────────────────────
  {
    id: "n-008",
    headline: "Haaland equals Premier League hat-trick record with stunning treble",
    summary: "Erling Haaland scored his 12th Premier League hat-trick to equal the all-time record. The Norwegian striker now has 27 league goals for the season, firmly establishing himself as the division's top scorer.",
    source: "BBC Sport",
    publishedAt: t(5 * H),
    category: "match",
    tags: ["Man City", "Premier League"],
  },
  {
    id: "n-009",
    headline: "De Bruyne returns to full training ahead of Champions League tie",
    summary: "Kevin De Bruyne has rejoined Manchester City's first-team training squad after recovering from a hamstring strain. Pep Guardiola is confident the Belgian will be available for the upcoming Champions League clash.",
    source: "Sky Sports",
    publishedAt: t(18 * H),
    category: "injury",
    tags: ["Man City", "Premier League"],
  },
  {
    id: "n-010",
    headline: "Guardiola: 'We must be relentless from now until the end of the season'",
    summary: "Pep Guardiola insists Manchester City cannot afford to slip up in the title run-in, with Arsenal breathing down their necks. The Catalan manager called for maximum focus ahead of a crucial run of fixtures.",
    source: "The Athletic",
    publishedAt: t(2 * D),
    category: "general",
    tags: ["Man City", "Premier League"],
  },

  // ── Liverpool ─────────────────────────────────────────────────────────────
  {
    id: "n-011",
    headline: "Salah contract standoff: Liverpool reject Saudi bid as Reds hold firm",
    summary: "Liverpool have turned down a substantial offer from a Saudi Pro League club for Mohamed Salah. The Egyptian star enters the final 18 months of his contract, with talks over an extension ongoing.",
    source: "The Athletic",
    publishedAt: t(1 * H),
    category: "transfer",
    tags: ["Liverpool", "Premier League"],
  },
  {
    id: "n-012",
    headline: "Alisson ruled out for three weeks with shoulder strain",
    summary: "Liverpool goalkeeper Alisson Becker has been sidelined with a shoulder injury sustained in training. Caoimhín Kelleher will deputise in goal as the Reds face a congested fixture schedule.",
    source: "Sky Sports",
    publishedAt: t(12 * H),
    category: "injury",
    tags: ["Liverpool", "Premier League"],
  },
  {
    id: "n-013",
    headline: "Liverpool's pressing stats lead the Premier League by a wide margin",
    summary: "Statistical analysis shows Liverpool are the highest-pressing team in the Premier League this season, recording the most successful high turnovers and the fastest transition speed from defence to attack.",
    source: "ESPN",
    publishedAt: t(3 * D),
    category: "analysis",
    tags: ["Liverpool", "Premier League"],
  },

  // ── Premier League (general) ──────────────────────────────────────────────
  {
    id: "n-014",
    headline: "Premier League confirms major VAR overhaul from next season",
    summary: "The Premier League has announced sweeping changes to VAR protocols including the introduction of on-field reviews for managers and updated handball guidelines, following months of consultation with clubs.",
    source: "BBC Sport",
    publishedAt: t(6 * H),
    category: "general",
    tags: ["Premier League"],
  },
  {
    id: "n-015",
    headline: "Premier League winter break dates confirmed for 2025",
    summary: "The Premier League has released the official schedule for the winter break, with clubs given a two-week window in February. The break aims to allow players time to recover from a gruelling first half of the season.",
    source: "Sky Sports",
    publishedAt: t(4 * D),
    category: "general",
    tags: ["Premier League"],
  },

  // ── Real Madrid ───────────────────────────────────────────────────────────
  {
    id: "n-016",
    headline: "Bellingham faces two-week absence after ankle knock",
    summary: "Real Madrid midfielder Jude Bellingham is set to miss two weeks of action after sustaining an ankle knock in training. The news is a blow to Carlo Ancelotti ahead of a vital run of La Liga and Champions League fixtures.",
    source: "Marca",
    publishedAt: t(4 * H),
    category: "injury",
    tags: ["Real Madrid", "La Liga"],
  },
  {
    id: "n-017",
    headline: "Vinicius Jr shortlisted for UEFA Player of the Year",
    summary: "Vinicius Jr has been named among the five finalists for the UEFA Player of the Year award after a blistering season that has seen him score 16 La Liga goals and dominate on the European stage.",
    source: "Marca",
    publishedAt: t(1 * D),
    category: "general",
    tags: ["Real Madrid", "La Liga"],
  },
  {
    id: "n-018",
    headline: "Real Madrid plan €150m summer raid for Premier League star",
    summary: "Real Madrid are preparing a blockbuster summer move for one of the Premier League's most sought-after midfielders. Ancelotti is said to have personally recommended the player to club president Florentino Perez.",
    source: "AS",
    publishedAt: t(5 * D),
    category: "transfer",
    tags: ["Real Madrid", "La Liga"],
  },

  // ── Barcelona ─────────────────────────────────────────────────────────────
  {
    id: "n-019",
    headline: "Lamine Yamal becomes youngest La Liga scorer in Barcelona history",
    summary: "Lamine Yamal broke yet another record, becoming the youngest player to score 9 La Liga goals for Barcelona. The teenage sensation has taken Europe by storm with his fearless direct running and clinical finishing.",
    source: "Mundo Deportivo",
    publishedAt: t(7 * H),
    category: "general",
    tags: ["Barcelona", "La Liga"],
  },
  {
    id: "n-020",
    headline: "Lewandowski returns from suspension ahead of Clasico",
    summary: "Robert Lewandowski is back available for Barcelona after serving a three-match suspension. The Polish striker's return is timely with El Clasico approaching, a fixture he has scored in twice before.",
    source: "Marca",
    publishedAt: t(16 * H),
    category: "injury",
    tags: ["Barcelona", "La Liga"],
  },
  {
    id: "n-021",
    headline: "Barcelona's financial recovery ahead of schedule – La Liga confirm",
    summary: "La Liga have confirmed Barcelona have met their first-year financial fair play targets ahead of schedule, allowing the club to increase their salary cap and participate in the January transfer market.",
    source: "The Athletic",
    publishedAt: t(4 * D),
    category: "general",
    tags: ["Barcelona", "La Liga"],
  },

  // ── La Liga (general) ─────────────────────────────────────────────────────
  {
    id: "n-022",
    headline: "La Liga clubs vote to reject Tebas broadcast restructuring plan",
    summary: "Spanish top-flight clubs voted against the league's new broadcast revenue restructuring proposal, with several mid-table sides concerned about the impact on smaller clubs' finances.",
    source: "Marca",
    publishedAt: t(2 * D),
    category: "general",
    tags: ["La Liga"],
  },

  // ── LA Lakers ─────────────────────────────────────────────────────────────
  {
    id: "n-023",
    headline: "LeBron James passes Karl Malone on all-time scoring list",
    summary: "LeBron James moved into second place on the NBA all-time scoring list, surpassing Karl Malone's 36,928 career points. James acknowledged the milestone but insisted the focus remains on winning a fifth championship.",
    source: "ESPN",
    publishedAt: t(3 * H),
    category: "general",
    tags: ["LA Lakers", "NBA"],
  },
  {
    id: "n-024",
    headline: "Anthony Davis listed as probable for Warriors clash after knee scare",
    summary: "Anthony Davis has been upgraded to probable after suffering a minor knee bruise in Wednesday's practice. The Lakers big man is expected to play through the discomfort in the high-profile matchup against Golden State.",
    source: "ESPN",
    publishedAt: t(9 * H),
    category: "injury",
    tags: ["LA Lakers", "NBA"],
  },
  {
    id: "n-025",
    headline: "Lakers eye buyout market ahead of trade deadline",
    summary: "The Los Angeles Lakers are monitoring several veteran players expected to become available via the buyout market as the NBA trade deadline approaches. The front office is prioritising shooting and playmaking depth.",
    source: "The Athletic",
    publishedAt: t(3 * D),
    category: "transfer",
    tags: ["LA Lakers", "NBA"],
  },

  // ── Golden State Warriors ─────────────────────────────────────────────────
  {
    id: "n-026",
    headline: "Curry shooting slump: 'I'm not worried, it'll turn,' says Kerr",
    summary: "Stephen Curry is in an uncharacteristic shooting slump, connecting on just 38% from three over his last six games. Coach Steve Kerr backed his superstar, pointing to defensive attention and fatigue as factors.",
    source: "ESPN",
    publishedAt: t(11 * H),
    category: "analysis",
    tags: ["Golden State Warriors", "NBA"],
  },
  {
    id: "n-027",
    headline: "Warriors' small-ball lineup experiment paying dividends in fourth quarters",
    summary: "Golden State's decision to deploy a small-ball five has generated a +12.4 net rating in fourth quarters this season, giving Steve Kerr a potent closing lineup option down the stretch.",
    source: "The Athletic",
    publishedAt: t(5 * D),
    category: "analysis",
    tags: ["Golden State Warriors", "NBA"],
  },

  // ── Boston Celtics ────────────────────────────────────────────────────────
  {
    id: "n-028",
    headline: "Tatum and Brown combine for 62 in Celtics' dominant road win",
    summary: "Jayson Tatum and Jaylen Brown combined for 62 points as the Boston Celtics crushed a playoff rival by 21 points on the road. The duo connected on 11 of 18 three-point attempts, devastating the opposing defence.",
    source: "ESPN",
    publishedAt: t(6 * H),
    category: "match",
    tags: ["Boston Celtics", "NBA"],
  },
  {
    id: "n-029",
    headline: "Celtics lead East by three games with league's best net rating",
    summary: "Boston hold the Eastern Conference's top seed and the NBA's best net rating at +9.1. Analysts are now openly discussing the Celtics as favourites not just for the conference title but for the championship.",
    source: "The Athletic",
    publishedAt: t(2 * D),
    category: "analysis",
    tags: ["Boston Celtics", "NBA"],
  },

  // ── Milwaukee Bucks ───────────────────────────────────────────────────────
  {
    id: "n-030",
    headline: "Giannis out two to three weeks with knee soreness – Bucks confirm",
    summary: "The Milwaukee Bucks have confirmed Giannis Antetokounmpo will miss at least two weeks after an MRI revealed significant inflammation in his left knee. The Bucks face a tricky stretch of fixtures without their MVP.",
    source: "ESPN",
    publishedAt: t(5 * H),
    category: "injury",
    tags: ["Milwaukee Bucks", "NBA"],
  },
  {
    id: "n-031",
    headline: "Bucks rally around Giannis: 'We've been here before,' says Lillard",
    summary: "Damian Lillard insists Milwaukee can navigate Giannis Antetokounmpo's injury layoff, pointing to previous adversity the squad has overcome. Lillard is expected to shoulder more of the offensive burden during the star's absence.",
    source: "ESPN",
    publishedAt: t(1 * D),
    category: "general",
    tags: ["Milwaukee Bucks", "NBA"],
  },

  // ── NBA (general) ─────────────────────────────────────────────────────────
  {
    id: "n-032",
    headline: "NBA All-Star Game format revamped with new tournament structure for 2025",
    summary: "The NBA has announced a major overhaul to the All-Star Game format, replacing the East vs West matchup with a four-team mini-tournament across two days. The league hopes the change will increase competitiveness.",
    source: "ESPN",
    publishedAt: t(3 * D),
    category: "general",
    tags: ["NBA"],
  },

  // ── Kansas City Chiefs ────────────────────────────────────────────────────
  {
    id: "n-033",
    headline: "Mahomes: 'We're built for the playoffs' after record-breaking December",
    summary: "Patrick Mahomes led the Chiefs to a sixth consecutive AFC West title, throwing for 4,200 yards and 35 touchdowns in a dominant regular season. Mahomes was bullish about the team's chances when the stakes are highest.",
    source: "ESPN",
    publishedAt: t(2 * H),
    category: "general",
    tags: ["Kansas City Chiefs", "NFL"],
  },
  {
    id: "n-034",
    headline: "Chiefs activate Travis Kelce from injury report ahead of playoff push",
    summary: "Travis Kelce has been removed from the injury report and is fully healthy heading into the postseason. The tight end finished with 93 receptions for 984 yards and 5 touchdowns despite battling ankle issues.",
    source: "ESPN",
    publishedAt: t(1 * D),
    category: "injury",
    tags: ["Kansas City Chiefs", "NFL"],
  },
  {
    id: "n-035",
    headline: "Chiefs' defence – the unit that could take them to back-to-back Super Bowls",
    summary: "Kansas City's defence has quietly become one of the NFL's best, allowing the fewest points per game in the AFC. Steve Spagnuolo's unit is the key reason analysts are once again backing the Chiefs for the Lombardi Trophy.",
    source: "The Athletic",
    publishedAt: t(4 * D),
    category: "analysis",
    tags: ["Kansas City Chiefs", "NFL"],
  },

  // ── Buffalo Bills ─────────────────────────────────────────────────────────
  {
    id: "n-036",
    headline: "Josh Allen throws five TDs in historic Bills victory over the Jets",
    summary: "Josh Allen put on a masterclass, throwing five touchdown passes in Buffalo's 42-10 demolition of the New York Jets. The display cemented Allen's status as an MVP frontrunner with just three weeks of the season remaining.",
    source: "ESPN",
    publishedAt: t(10 * H),
    category: "match",
    tags: ["Buffalo Bills", "NFL"],
  },
  {
    id: "n-037",
    headline: "Bills' defensive coordinator calls unit 'ready to peak at the right time'",
    summary: "Buffalo's defensive coordinator expressed confidence that the Bills' defence is timing its best form for the playoffs, having significantly tightened up after a shaky start to the season.",
    source: "The Athletic",
    publishedAt: t(3 * D),
    category: "preview",
    tags: ["Buffalo Bills", "NFL"],
  },

  // ── San Francisco 49ers ───────────────────────────────────────────────────
  {
    id: "n-038",
    headline: "McCaffrey wins NFC Offensive Player of the Year award",
    summary: "Christian McCaffrey claimed the NFC Offensive Player of the Year award after rushing for 1,062 yards and 14 touchdowns, while also contributing significantly as a receiver. The accolade is the latest in a remarkable individual season.",
    source: "ESPN",
    publishedAt: t(7 * H),
    category: "general",
    tags: ["San Francisco 49ers", "NFL"],
  },
  {
    id: "n-039",
    headline: "49ers lock up NFC's No. 1 seed with dominant Week 14 performance",
    summary: "San Francisco secured the NFC's top seed and home-field advantage throughout the playoffs with a commanding 31-13 victory. The 49ers will host all their NFC playoff games barring a Super Bowl appearance.",
    source: "ESPN",
    publishedAt: t(4 * D),
    category: "match",
    tags: ["San Francisco 49ers", "NFL"],
  },

  // ── Philadelphia Eagles ───────────────────────────────────────────────────
  {
    id: "n-040",
    headline: "Jalen Hurts clears concussion protocol and is ready for playoffs",
    summary: "Philadelphia Eagles quarterback Jalen Hurts has fully cleared the NFL's concussion protocol and is available for the upcoming playoff run. Head coach Nick Sirianni confirmed the signal-caller took every first-team rep in Thursday's practice.",
    source: "ESPN",
    publishedAt: t(13 * H),
    category: "injury",
    tags: ["Philadelphia Eagles", "NFL"],
  },
  {
    id: "n-041",
    headline: "Eagles' offensive line rated best in NFL for third straight season",
    summary: "Pro Football Focus has rated the Philadelphia Eagles' offensive line as the best in the league for the third consecutive year. The unit has allowed the fewest sacks and opened the most running lanes in the entire league.",
    source: "The Athletic",
    publishedAt: t(5 * D),
    category: "analysis",
    tags: ["Philadelphia Eagles", "NFL"],
  },

  // ── NFL (general) ─────────────────────────────────────────────────────────
  {
    id: "n-042",
    headline: "NFL playoff picture confirmed: bracket set for wildcard weekend",
    summary: "The NFL postseason field is set following the conclusion of the regular season. All seven seeds in both conferences are confirmed, with the Chiefs and 49ers holding the top seeds in their respective conferences.",
    source: "ESPN",
    publishedAt: t(2 * D),
    category: "general",
    tags: ["NFL"],
  },

  // ── Mumbai Indians ────────────────────────────────────────────────────────
  {
    id: "n-043",
    headline: "Bumrah cleared for IPL 2024 season opener after BCCI rest period",
    summary: "Jasprit Bumrah has been cleared to play in Mumbai Indians' IPL 2024 campaign opener after being given a mandatory rest period following the Test series. MI fans will be relieved to have their ace pacer available from the start.",
    source: "SportStar",
    publishedAt: t(4 * H),
    category: "injury",
    tags: ["Mumbai Indians", "IPL"],
  },
  {
    id: "n-044",
    headline: "Rohit Sharma to lead Mumbai Indians in bid for sixth IPL title",
    summary: "Rohit Sharma has confirmed he will captain Mumbai Indians in the 2024 IPL, dismissing rumours of a move to another franchise. The five-time IPL winner is determined to add another title to his remarkable legacy.",
    source: "SportStar",
    publishedAt: t(1 * D),
    category: "general",
    tags: ["Mumbai Indians", "IPL"],
  },
  {
    id: "n-045",
    headline: "MI unveil new franchise jersey for IPL 2024 ahead of season launch",
    summary: "Mumbai Indians have unveiled their much-anticipated new jersey for IPL 2024, featuring a refreshed blue colourway with golden accents. The jersey launch event drew thousands of fans to Wankhede Stadium.",
    source: "SportStar",
    publishedAt: t(6 * D),
    category: "general",
    tags: ["Mumbai Indians", "IPL"],
  },

  // ── Chennai Super Kings ───────────────────────────────────────────────────
  {
    id: "n-046",
    headline: "MS Dhoni confirms he will play another IPL season as CSK captain",
    summary: "MS Dhoni has ended speculation by confirming he will captain Chennai Super Kings in IPL 2024. The legendary wicketkeeper-batsman, who turns 43 during the tournament, insists he still has the hunger to compete.",
    source: "SportStar",
    publishedAt: t(6 * H),
    category: "general",
    tags: ["Chennai Super Kings", "IPL"],
  },
  {
    id: "n-047",
    headline: "CSK secure Mitchell Starc in record-breaking IPL auction",
    summary: "Chennai Super Kings made history at the IPL auction by securing Australian fast bowler Mitchell Starc for ₹24.75 crore – the highest price ever paid for a player in the tournament's history.",
    source: "SportStar",
    publishedAt: t(2 * D),
    category: "transfer",
    tags: ["Chennai Super Kings", "IPL"],
  },
  {
    id: "n-048",
    headline: "Jadeja's all-round brilliance earns CSK last-ball win in thriller",
    summary: "Ravindra Jadeja delivered a stunning all-round performance – 38 off 16 balls followed by 2 wickets – as Chennai Super Kings snatched victory off the final delivery in a match that had the crowd on its feet throughout.",
    source: "SportStar",
    publishedAt: t(3 * D),
    category: "match",
    tags: ["Chennai Super Kings", "IPL"],
  },

  // ── IPL (general) ─────────────────────────────────────────────────────────
  {
    id: "n-049",
    headline: "IPL 2024 set to be biggest ever with record ₹48,000 crore broadcast deal",
    summary: "The Board of Control for Cricket in India has confirmed the 2024 Indian Premier League will be the most-watched cricket tournament ever, backed by a record-breaking broadcast rights agreement spanning five years.",
    source: "SportStar",
    publishedAt: t(4 * D),
    category: "general",
    tags: ["IPL"],
  },

  // ── Novak Djokovic ────────────────────────────────────────────────────────
  {
    id: "n-050",
    headline: "Djokovic confirms full clay-court schedule after wrist injury recovery",
    summary: "Novak Djokovic has confirmed he is fully fit and will play the entire clay-court swing, having recovered from a wrist injury that kept him out of two hard-court Masters events. The Serb is targeting a record 25th Grand Slam title at Roland Garros.",
    source: "Tennis World",
    publishedAt: t(3 * H),
    category: "injury",
    tags: ["Novak Djokovic", "N. Djokovic", "ATP Masters"],
  },
  {
    id: "n-051",
    headline: "'I still believe I can be No. 1 again' – Djokovic's bold statement",
    summary: "Despite dropping to No. 3 in the ATP rankings, Novak Djokovic insists his best tennis is not behind him and is fully committed to reclaiming the world number one spot. The 37-year-old's resolve remains undiminished.",
    source: "Tennis World",
    publishedAt: t(2 * D),
    category: "general",
    tags: ["Novak Djokovic", "N. Djokovic", "ATP Masters"],
  },

  // ── Carlos Alcaraz ────────────────────────────────────────────────────────
  {
    id: "n-052",
    headline: "Alcaraz targeting all four Grand Slams after historic Wimbledon defence",
    summary: "Carlos Alcaraz has set his sights on completing a calendar Grand Slam after successfully defending his Wimbledon title. The Spaniard is working on his serve and net game to become more dominant on faster surfaces.",
    source: "Tennis World",
    publishedAt: t(5 * H),
    category: "general",
    tags: ["Carlos Alcaraz", "C. Alcaraz", "ATP Masters"],
  },
  {
    id: "n-053",
    headline: "Alcaraz's 16-match winning streak ended by Sinner in epic Masters final",
    summary: "Jannik Sinner brought Carlos Alcaraz's brilliant 16-match winning streak to an end in a breathtaking five-set Masters final. The match lasted four hours and 22 minutes and is already being called one of the greatest of the era.",
    source: "Tennis World",
    publishedAt: t(3 * D),
    category: "match",
    tags: ["Carlos Alcaraz", "C. Alcaraz", "Jannik Sinner", "J. Sinner", "ATP Masters"],
  },

  // ── Jannik Sinner ─────────────────────────────────────────────────────────
  {
    id: "n-054",
    headline: "Sinner becomes youngest world No. 1 since Nadal in 2006",
    summary: "Jannik Sinner has claimed the ATP world number one ranking, becoming the youngest player to reach the top spot since Rafael Nadal in 2006. The Italian's consistency throughout 2024 – with four titles including two Grand Slams – made him a worthy champion.",
    source: "Tennis World",
    publishedAt: t(1 * H),
    category: "general",
    tags: ["Jannik Sinner", "J. Sinner", "ATP Masters"],
  },
  {
    id: "n-055",
    headline: "Sinner's coaching team credits tactical evolution for record-breaking season",
    summary: "The team behind Jannik Sinner's historic 2024 season has revealed the key tactical changes that enabled the Italian to dominate. Adjustments to his second serve and a more aggressive return game were central to the transformation.",
    source: "The Athletic",
    publishedAt: t(4 * D),
    category: "analysis",
    tags: ["Jannik Sinner", "J. Sinner", "ATP Masters"],
  },

  // ── Daniil Medvedev ───────────────────────────────────────────────────────
  {
    id: "n-056",
    headline: "Medvedev defeats Zverev in four sets to reach ATP Masters semi-final",
    summary: "Daniil Medvedev produced a controlled display to overcome Alexander Zverev in four sets, setting up a tantalising semi-final showdown. The Russian mixed powerful groundstrokes with precise drop shots to bamboozle his opponent.",
    source: "Tennis World",
    publishedAt: t(15 * H),
    category: "match",
    tags: ["Daniil Medvedev", "D. Medvedev", "ATP Masters"],
  },
  {
    id: "n-057",
    headline: "Medvedev: 'I want to recapture the No. 1 ranking before I retire'",
    summary: "Daniil Medvedev has spoken candidly about his motivation to return to the top of the ATP rankings after slipping to No. 4. The former world number one remains one of the most dangerous players on the Tour.",
    source: "Tennis World",
    publishedAt: t(6 * D),
    category: "general",
    tags: ["Daniil Medvedev", "D. Medvedev", "ATP Masters"],
  },

  // ── ATP Masters (general) ─────────────────────────────────────────────────
  {
    id: "n-058",
    headline: "ATP announces 30% prize money increase across Masters events for 2025",
    summary: "The Association of Tennis Professionals has confirmed a significant prize money uplift for the 2025 Masters 1000 circuit. The increase is designed to bring ATP events closer to parity with WTA prize funds.",
    source: "Tennis World",
    publishedAt: t(5 * D),
    category: "general",
    tags: ["ATP Masters"],
  },
];

export function getNewsForTags(tags: string[]): NewsItem[] {
  return SAMPLE_NEWS
    .filter((item) => tags.some((tag) => item.tags.includes(tag)))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
