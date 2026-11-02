Zbadaj i zaprojektuj rotację bloków - plugin cs 1.6 blockmarker easyblock
 
Sprawdź, czy główna baza ma już częściową obsługę rotacji lub kątów encji.
 
Jeżeli nie, oceń możliwość dodania obracania bloków:
 
wokół osi X, Y i Z, jeśli pozwala na to technologia;
 
o ustalony kąt, np. 15°, 45° lub 90°;
 
z możliwością precyzyjnej zmiany i cofania obrotu;
 
z zachowaniem położenia i orientacji podczas zapisu oraz odczytu;
 
z uwzględnieniem kolizji i bounding boxów;
 
bez uszkadzania istniejących map i zapisów;
 
z uwzględnieniem bloków specjalnych, takich jak teleporty, trampoliny i bloki przyspieszające.
 
Nie zakładaj, że obrót wizualny modelu automatycznie obraca jego kolizję. Sprawdź rzeczywiste ograniczenia silnika CS 1.6 i sposobu reprezentowania encji.
 
Jeżeli pełna rotacja nie jest możliwa w obecnej architekturze, zaproponuj realistyczne rozwiązanie częściowe i wyjaśnij ograniczenia.

#include <amxmodx>
#include <amxmisc>
#include <cstrike>
#include <engine>
#include <fakemeta>
#include <hamsandwich>
#include <fun>
 
#pragma semicolon 1
 
#define PLUGIN_NAME					"ProFragsMaker"
#define PLUGIN_VERSION				"2.2"
#define PLUGIN_AUTHOR				"NaszeBlokiSaZajebiste.eu"
#define PLUGIN_PREFIX				"ProFragsMaker"
#define PITCH_NORM 100
#define ATTN_NORM 0.80
#define CHAN_STREAM 5
#define MAX_ENT 		(900+32*15)
 
native exp_get_user_exp(client);
native exp_set_user_exp(client, xp);
 
stock hnsxp_add_user_xp(client, xp)
{
	return exp_set_user_exp(client, exp_get_user_exp(client) + xp);
}
 
 
new const g_blank[] =				"";
new const g_a[] =				"a";
new const g_b[] =				"b";
 
new g_flameSpr;
 
new const g_block_classname[] =			"Block";
new const g_start_classname[] =			"TeleportStart";
new const g_destination_classname[] =		"TeleportDestination";
new const g_light_classname[] =			"Light";
 
// Assetos (modele/dzwieki/sprite'y) sa wczytywane z configs/profragsmaker_assets.ini.
#define ASSET_PATH_LEN 128
new g_sprite_light[ASSET_PATH_LEN], g_sprite_teleport_start[ASSET_PATH_LEN];
new g_sprite_teleport_destination[ASSET_PATH_LEN], sprite_grenade_fire[ASSET_PATH_LEN];
new g_sound_invincibility[ASSET_PATH_LEN], g_sound_stealth[ASSET_PATH_LEN], g_sound_camouflage[ASSET_PATH_LEN];
new g_sound_boots_of_speed[ASSET_PATH_LEN], g_sound_melanz[ASSET_PATH_LEN], g_sound_bron[ASSET_PATH_LEN];
new g_sound_kasa[ASSET_PATH_LEN], g_sound_TeleportSound[ASSET_PATH_LEN];
new gsz1[ASSET_PATH_LEN], gsz2[ASSET_PATH_LEN], gsz3[ASSET_PATH_LEN], gsz4[ASSET_PATH_LEN];
new gsz5[ASSET_PATH_LEN], gsz6[ASSET_PATH_LEN], gsz7[ASSET_PATH_LEN], gsz8[ASSET_PATH_LEN];
new gsz9[ASSET_PATH_LEN], gsz10[ASSET_PATH_LEN], gsz11[ASSET_PATH_LEN], gsz12[ASSET_PATH_LEN];
new g_sprite_laserbeam[ASSET_PATH_LEN], g_sprite_beam_path[ASSET_PATH_LEN];
new g_sprite_beam;
new g_sprite_saber;
new gszCamouflageOldModel[33][32];
//new bool:ExpUsed[1024][33];
new UzylGranaty[33];
new UsedNade[33][3];
 
new bool:KasaUsed[33];
new Float:fTempVelo[33][3], Float:fVelo[MAX_ENT][3], Float:g_fOrigin[MAX_ENT][3], g_iFlyDistance[MAX_ENT], g_iTempFlyDistance[33];
 
enum ( <<= 1 )
{
	B1 = 1,
	B2,
	B3,
	B4,
	B5,
	B6,
	B7,
	B8,
	B9,
	B0
};
 
enum
{
	K1,
	K2,
	K3,
	K4,
	K5,
	K6,
	K7,
	K8,
	K9,
	K0
};
 
enum
{
	CHOICE_DELETE,
	CHOICE_LOAD
};
 
enum
{
	X,
	Y,
	Z
};
 
enum ( += 1000 )
{
	TASK_SPRITE = 1000,
	TASK_SOLID,
	TASK_SOLIDNOT,
	TASK_ICE,
	TASK_HONEY,
	TASK_NOSLOWDOWN,
	TASK_INVINCIBLE,
	TASK_STEALTH,
	TASK_BOOTSOFSPEED,
	TASK_KAMUFLAZ,
	TASK_MELANZ
};
 
new g_file[64];
 
new g_keys_main_menu;
new g_keys_block_menu;
new g_keys_block_selection_menu;
new g_keys_properties_menu;
new g_keys_move_menu;
new g_keys_teleport_menu;
new g_keys_light_menu;
new g_keys_light_properties_menu;
new g_keys_options_menu;
new g_keys_choice_menu;
new g_keys_commands_menu;
new gRenderMenuKeys;
new gKeysFlyMenu;
new g_keys_weapons_menu, g_keys_weapons_menu2, g_keys_weapons_menu3, g_keys_weapons_menu4;
 
new g_main_menu[256];
new g_block_menu[256];
new g_move_menu[256];
new g_teleport_menu[256];
new g_light_menu[128];
new g_light_properties_menu[256];
new g_options_menu[256];
new g_choice_menu[128];
new g_commands_menu[256];
new gRenderMenu[256];
new gszFlyMenu[256];
new g_weapons_menu[256], g_weapons_menu2[256], g_weapons_menu3[256], g_weapons_menu4[256];
 
new g_viewmodel[33][32];
 
new bool:g_connected[33];
new bool:g_alive[33];
new bool:g_admin[33];
new bool:g_gived_access[33];
new bool:g_snapping[33];
new bool:g_viewing_properties_menu[33];
new bool:g_viewing_light_properties_menu[33];
new bool:g_viewing_commands_menu[33];
new bool:g_no_fall_damage[33];
new bool:g_ice[33];
new bool:g_no_slow_down[33];
new bool:g_has_hud_text[33];
new bool:g_block_status[33];
new bool:g_noclip[33];
new g_noclip_mul[33];
new bool:g_noclip_have_from[33];
new Float:g_noclip_from[33][3];
new bool:g_godmode[33];
new bool:g_all_godmode;
new bool:g_has_checkpoint[33];
new bool:g_checkpoint_duck[33];
new bool:g_reseted[33];
 
new g_selected_block_size[33];
new g_choice_option[33];
new g_block_selection_page[33];
new g_weapons_page[33];
new g_teleport_start[33];
new g_grabbed[33];
new g_grouped_blocks[33][256];
new g_group_count[33];
new g_property_info[33][2];
new g_light_property_info[33][2];
new g_honey[33];
new g_boots_of_speed[33];
new g_luke[33];
 
new Float:g_grid_size[33];
new Float:g_snapping_gap[33];
new Float:g_grab_offset[33][3];
new Float:g_grab_length[33];
new Float:g_next_damage_time[33];
new Float:g_next_heal_time[33];
new Float:g_next_armor_time[33];
new Float:g_invincibility_time_out[33];
new Float:g_invincibility_next_use[33];
new Float:g_stealth_time_out[33];
new Float:g_stealth_next_use[33];
new Float:g_kamuflaz_time_out[33];
new Float:g_kamuflaz_next_use[33];
new Float:g_boots_of_speed_time_out[33];
new Float:g_boots_of_speed_next_use[33];
new Float:g_luke_next_use[33];
 
new Float:g_melanz_time_out[33];
new Float:g_melanz_next_use[33];
 
new Float:g_set_velocity[33][3];
new Float:g_checkpoint_position[33][3];
// Render Menu
new Przezroczystosc[33],gRenderInfo[33], gTyp[33];
new Czerwony[33], Zielony[33], Niebieski[33];
 
 
new Float:gfMuzaNextUse[33];
new Float:gfMuzaTimeOut[33];
 
new g_cvar_textures;
 
new g_max_players;
enum
{
	NORMAL,
	GLOWSHELL,
	TRANSCOLOR,
	TRANSALPHA,
	TRANSWHITE,
	GLOWALPHA,
	HOLOGRAM,
	FADEFAST
};
enum
{
	PLATFORM,
	BUNNYHOP,
	DAMAGE,
	HEALER,
	NO_FALL_DAMAGE,
	ICE,
	TRAMPOLINE,
	SPEED_BOOST,
	DEATH,
	HONEY,
	CT_BARRIER,
	T_BARRIER,
	GLASS,
	NO_SLOW_DOWN_BUNNYHOP,
	DELAYED_BUNNYHOP,
	INVINCIBILITY,
	STEALTH,
	BOOTS_OF_SPEED,
	KAMUFLAZ,
	BRON,
	ARMOR,
	SPAMDUCK,
	GRANATY,
	VIP,
	OSLEPIENIE,
	TRZESIENIE,
	TRAWA,
	MELANZ,
	DREWNO,
	EXP,
	MUZA,
	BHDAMAGE,
	BHICE,
	HE,
	SG,
	FLASH,
	CARPET,
	LUKE,
 
	TOTAL_BLOCKS
};
 
enum
{
	TELEPORT_START,
	TELEPORT_DESTINATION
};
 
enum
{
	NORMAL,
	TINY,
	LARGE,
	POLE
};
 
enum
{
	NORMAL,
	GLOWSHELL,
	TRANSCOLOR,
	TRANSALPHA,
	TRANSWHITE
};
 
new g_selected_block_type[TOTAL_BLOCKS];
new g_render[TOTAL_BLOCKS];
new g_red[TOTAL_BLOCKS];
new g_green[TOTAL_BLOCKS];
new g_blue[TOTAL_BLOCKS];
new g_alpha[TOTAL_BLOCKS];
new BronUsed[27][33];
new const g_block_names[TOTAL_BLOCKS][] =
{
	"Platforma",
	"Bunnyhop",
	"Obrazenia",
	"Leczenie",
	"Nofalldamage",
	"Lod",
	"Trampolina",
	"Strzalka",
	"Smierc",
	"Miod",
	"Bariera CT",
	"Bariera TT",
	"Szyba",
	"Bunnyhop No Slow Down",
	"Opozniony BH",
	"Niesmiertelnosc",
	"Niewidzialnosc",
	"Buty Szybkosci",
	"Kamuflaz",
	"Bron",
	"Armor",
	"Spamduck",
	"Granaty",
	"VIP Bariera",
	"Oslepienie",
	"Trzesienie Ziemi",
	"Trawa",
	"Melanz",
	"Drewno",
	"Exp",
	"Muza",
	"Bunnyhop Damage",
	"Bunnyhop Lod",
	"Granat Wybuchajacy",
	"Granat Zamrazajacy",
	"Granat Oslepiajacy",
	"Dywan",
	"Luke Skywalker"
};
 
new const g_property1_name[TOTAL_BLOCKS][] =
{
	"",
	"Brak obrazen po upadku",
	"Obrazenia na sekunde",
	"Zycia na sekunde",
	"",
	"",
	"Wysokosc",
	"Moc wyrzutu",
	"Zabija z godmodem",
	"Szybkosc",
	"",
	"",
	"",
	"Brak obrazen po upadku",
	"Opoznienie",
	"Czas trwania",
	"Czas trwania",
	"Czas Trwania",
	"Czas Trwania",
	"Bron",
	"Ilosc dodawanego armoru",
	"",
	"Ile razy mozna wziasc",
	"",
	"Czas oslepienia",
	"Moc",
	"",
	"Czas",
	"",
	"Ilosc Expa",
	"",
	"Obrazenia",
	"",
	"Mozna wziac",
	"Mozna wziac",
	"Mozna wziac",
	"",
	"Czas Trwania"
};
 
new const g_property1_default_value[TOTAL_BLOCKS][] =
{
	"",
	"0",
	"5",
	"1",
	"",
	"",
	"500",
	"1000",
	"0",
	"75",
	"",
	"",
	"",
	"0",
	"1",
	"10",
	"10",
	"10",
	"15",
	"deagle",
	"5",
	"",
	"",
	"",
	"5",
	"10",
	"",
	"10",
	"",
	"5",
	"",
	"5",
	"",
	"1",
	"1",
	"1",
	"",
	"5"
};
 
new const g_property2_name[TOTAL_BLOCKS][] =
{
	"",
	"",
	"Zadaje obrazenia co",
	"Leczy HP co",
	"",
	"",
	"",
	"Moc wyrzutu 2",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"Nastepne uzycie",
	"Nastepne uzycie",
	"Nastepne uzycie",
	"Nastepne uzycie",
	"Naboje",
	"Dodaje armor co",
	"",
	"",
	"",
	"",
	"Czas",
	"",
	"Mozna uzyc co",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"Nastepne uzycie"
};
 
new const g_property2_default_value[TOTAL_BLOCKS][] =
{
	"",
	"",
	"0.5",
	"0.5",
	"",
	"",
	"",
	"200",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"60",
	"60",
	"60",
	"1",
	"1",
	"3",
	"",
	"",
	"",
	"3",
	"",
	"120",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"30"
};
 
new const g_property3_name[TOTAL_BLOCKS][] =
{
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Szybkosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc",
	"Przezroczystosc"
};
 
new const g_property3_default_value[TOTAL_BLOCKS][] =
{
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"320",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255",
	"255"
};
 
new const g_property4_name[TOTAL_BLOCKS][] =
{
	"",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"",
	"",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"",
	"Tylko od gory",
	"",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory",
	"Tylko od gory"
 
};
 
new const g_property4_default_value[TOTAL_BLOCKS][] =
{
	"",
	"0",
	"1",
	"1",
	"",
	"",
	"0",
	"0",
	"1",
	"0",
	"0",
	"0",
	"",
	"0",
	"0",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"1",
	"",
	"1",
	"",
	"1",
	"1",
	"0",
	"0",
	"1",
	"1",
	"1",
	"1",
	"1"
};
 
new const g_block_save_ids[TOTAL_BLOCKS] =
{
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'Y',
	'1',
	'2',
	'3',
	'4',
	'6',
	'7',
	'5',
	'8',
	'9',
	'%',
	'#',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g'
};
 
new g_block_models[TOTAL_BLOCKS][256];
new g_block_models_tiny[TOTAL_BLOCKS][256], g_block_models_large[TOTAL_BLOCKS][256], g_block_models_pole[TOTAL_BLOCKS][256];
 
new g_block_selection_pages_max;
 
new maxhp[33], bool:g_melanz[33], Float:g_speedmelanz[33];
 
stock ReadAssetPath(const key[], output[], outputLen)
{
	new configsDir[128], configFile[192], line[256], lineLen, pos;
	get_localinfo("amxx_configsdir", configsDir, charsmax(configsDir));
	formatex(configFile, charsmax(configFile), "%s/profragsmaker_assets.ini", configsDir);
	while (read_file(configFile, pos++, line, charsmax(line), lineLen))
	{
		trim(line);
		if (!line[0] || line[0] == ';' || line[0] == '#') continue;
		new configKey[64], configValue[ASSET_PATH_LEN];
		if (parse(line, configKey, charsmax(configKey), configValue, charsmax(configValue)) != 2) continue;
		if (equali(configKey, key))
		{
			copy(output, outputLen, configValue);
			return 1;
		}
	}
	log_amx("Brak klucza '%s' w configs/profragsmaker_assets.ini", key);
	return 0;
}
 
stock LoadAssetPaths()
{
	ReadAssetPath("sprite_light", g_sprite_light, charsmax(g_sprite_light));
	ReadAssetPath("sprite_teleport_start", g_sprite_teleport_start, charsmax(g_sprite_teleport_start));
	ReadAssetPath("sprite_teleport_destination", g_sprite_teleport_destination, charsmax(g_sprite_teleport_destination));
	ReadAssetPath("sprite_grenade_fire", sprite_grenade_fire, charsmax(sprite_grenade_fire));
	ReadAssetPath("sprite_laserbeam", g_sprite_laserbeam, charsmax(g_sprite_laserbeam));
	ReadAssetPath("sprite_beam", g_sprite_beam_path, charsmax(g_sprite_beam_path));
	ReadAssetPath("sound_invincibility", g_sound_invincibility, charsmax(g_sound_invincibility));
	ReadAssetPath("sound_stealth", g_sound_stealth, charsmax(g_sound_stealth));
	ReadAssetPath("sound_camouflage", g_sound_camouflage, charsmax(g_sound_camouflage));
	ReadAssetPath("sound_boots_of_speed", g_sound_boots_of_speed, charsmax(g_sound_boots_of_speed));
	ReadAssetPath("sound_melanz", g_sound_melanz, charsmax(g_sound_melanz));
	ReadAssetPath("sound_bron", g_sound_bron, charsmax(g_sound_bron));
	ReadAssetPath("sound_kasa", g_sound_kasa, charsmax(g_sound_kasa));
	ReadAssetPath("sound_teleport", g_sound_TeleportSound, charsmax(g_sound_TeleportSound));
	ReadAssetPath("music_1", gsz1, charsmax(gsz1));
	ReadAssetPath("music_2", gsz2, charsmax(gsz2));
	ReadAssetPath("music_3", gsz3, charsmax(gsz3));
	ReadAssetPath("music_4", gsz4, charsmax(gsz4));
	ReadAssetPath("music_5", gsz5, charsmax(gsz5));
	ReadAssetPath("music_6", gsz6, charsmax(gsz6));
	ReadAssetPath("music_7", gsz7, charsmax(gsz7));
	ReadAssetPath("music_8", gsz8, charsmax(gsz8));
	ReadAssetPath("music_9", gsz9, charsmax(gsz9));
	ReadAssetPath("music_10", gsz10, charsmax(gsz10));
	ReadAssetPath("music_11", gsz11, charsmax(gsz11));
	ReadAssetPath("music_12", gsz12, charsmax(gsz12));
}
 
stock bool:IsMusicFileAvailable(index)
{
	new relativePath[ASSET_PATH_LEN], fullPath[ASSET_PATH_LEN + 8];
	switch (index)
	{
		case 0: copy(relativePath, charsmax(relativePath), gsz1);
		case 1: copy(relativePath, charsmax(relativePath), gsz2);
		case 2: copy(relativePath, charsmax(relativePath), gsz3);
		case 3: copy(relativePath, charsmax(relativePath), gsz4);
		case 4: copy(relativePath, charsmax(relativePath), gsz5);
		case 5: copy(relativePath, charsmax(relativePath), gsz6);
		case 6: copy(relativePath, charsmax(relativePath), gsz7);
		case 7: copy(relativePath, charsmax(relativePath), gsz8);
		case 8: copy(relativePath, charsmax(relativePath), gsz9);
		case 9: copy(relativePath, charsmax(relativePath), gsz10);
		case 10: copy(relativePath, charsmax(relativePath), gsz11);
		case 11: copy(relativePath, charsmax(relativePath), gsz12);
	}
	if (!relativePath[0]) return false;
	formatex(fullPath, charsmax(fullPath), "sound/%s", relativePath);
	return file_exists(fullPath) != 0;
}
 
stock LoadBlockModelVariants(blockType, const modelKey[])
{
	new key[64];
	formatex(key, charsmax(key), "%s_normal", modelKey);
	ReadAssetPath(key, g_block_models[blockType], charsmax(g_block_models[]));
	formatex(key, charsmax(key), "%s_tiny", modelKey);
	ReadAssetPath(key, g_block_models_tiny[blockType], charsmax(g_block_models_tiny[]));
	formatex(key, charsmax(key), "%s_large", modelKey);
	ReadAssetPath(key, g_block_models_large[blockType], charsmax(g_block_models_large[]));
	formatex(key, charsmax(key), "%s_pole", modelKey);
	ReadAssetPath(key, g_block_models_pole[blockType], charsmax(g_block_models_pole[]));
}
public plugin_precache()
{
	LoadAssetPaths();
	// Laduj cztery jawne warianty modelu dla kazdego typu bloku.
	LoadBlockModelVariants(PLATFORM, "model_platform");
	LoadBlockModelVariants(BUNNYHOP, "model_bunnyhop");
	LoadBlockModelVariants(DAMAGE, "model_damage");
	LoadBlockModelVariants(HEALER, "model_healer");
	LoadBlockModelVariants(NO_FALL_DAMAGE, "model_no_fall_damage");
	LoadBlockModelVariants(ICE, "model_ice");
	LoadBlockModelVariants(TRAMPOLINE, "model_trampoline");
	LoadBlockModelVariants(SPEED_BOOST, "model_speed_boost");
	LoadBlockModelVariants(DEATH, "model_death");
	LoadBlockModelVariants(HONEY, "model_honey");
	LoadBlockModelVariants(CT_BARRIER, "model_ct_barrier");
	LoadBlockModelVariants(T_BARRIER, "model_t_barrier");
	LoadBlockModelVariants(GLASS, "model_glass");
	LoadBlockModelVariants(NO_SLOW_DOWN_BUNNYHOP, "model_no_slow_down_bunnyhop");
	LoadBlockModelVariants(DELAYED_BUNNYHOP, "model_delayed_bunnyhop");
	LoadBlockModelVariants(INVINCIBILITY, "model_invincibility");
	LoadBlockModelVariants(STEALTH, "model_stealth");
	LoadBlockModelVariants(BOOTS_OF_SPEED, "model_boots_of_speed");
	LoadBlockModelVariants(BRON, "model_bron");
	LoadBlockModelVariants(KAMUFLAZ, "model_kamuflaz");
	LoadBlockModelVariants(ARMOR, "model_armor");
	LoadBlockModelVariants(SPAMDUCK, "model_spamduck");
	LoadBlockModelVariants(GRANATY, "model_granaty");
	LoadBlockModelVariants(VIP, "model_vip");
	LoadBlockModelVariants(OSLEPIENIE, "model_oslepienie");
	LoadBlockModelVariants(TRZESIENIE, "model_trzesienie");
	LoadBlockModelVariants(TRAWA, "model_trawa");
	LoadBlockModelVariants(MELANZ, "model_melanz");
	LoadBlockModelVariants(DREWNO, "model_drewno");
	LoadBlockModelVariants(EXP, "model_exp");
	LoadBlockModelVariants(MUZA, "model_muza");
	LoadBlockModelVariants(BHDAMAGE, "model_bhdamage");
	LoadBlockModelVariants(BHICE, "model_bhice");
	LoadBlockModelVariants(HE, "model_he");
	LoadBlockModelVariants(SG, "model_sg");
	LoadBlockModelVariants(FLASH, "model_flash");
	LoadBlockModelVariants(CARPET, "model_dywan");
	LoadBlockModelVariants(LUKE, "model_luke");
 
	SetupBlockRendering(GLASS, TRANSWHITE, 255, 255, 255, 100);
	SetupBlockRendering(INVINCIBILITY, GLOWSHELL, 255, 255, 255, 16);
	SetupBlockRendering(STEALTH, TRANSWHITE, 255, 255, 255, 100);
	g_flameSpr = engfunc(EngFunc_PrecacheModel, sprite_grenade_fire);
	for ( new i = 0; i < TOTAL_BLOCKS; ++i )
	{
		precache_model(g_block_models[i]);
 
		precache_model(g_block_models_tiny[i]);
		precache_model(g_block_models_large[i]);
		precache_model(g_block_models_pole[i]);
	}
 
	precache_model(g_sprite_light);
	g_sprite_saber = precache_model(g_sprite_laserbeam);
 
	precache_model(g_sprite_teleport_start);
	precache_model(g_sprite_teleport_destination);
	g_sprite_beam = precache_model(g_sprite_beam_path);
 
	precache_sound(g_sound_invincibility);
	precache_sound(g_sound_stealth);
	precache_sound(g_sound_camouflage);
	precache_sound(g_sound_boots_of_speed);
	precache_sound(g_sound_bron);
	precache_sound(g_sound_melanz);
	precache_sound(g_sound_TeleportSound);
	precache_sound(g_sound_kasa);
	new soundFile[ASSET_PATH_LEN], fullSoundPath[ASSET_PATH_LEN + 8];
	// Muzyka jest opcjonalna: precache'ujemy tylko wpisane pliki, ktore istnieja.
	for (new i = 0; i < 12; i++)
	{
		switch (i)
		{
			case 0: copy(soundFile, charsmax(soundFile), gsz1);
			case 1: copy(soundFile, charsmax(soundFile), gsz2);
			case 2: copy(soundFile, charsmax(soundFile), gsz3);
			case 3: copy(soundFile, charsmax(soundFile), gsz4);
			case 4: copy(soundFile, charsmax(soundFile), gsz5);
			case 5: copy(soundFile, charsmax(soundFile), gsz6);
			case 6: copy(soundFile, charsmax(soundFile), gsz7);
			case 7: copy(soundFile, charsmax(soundFile), gsz8);
			case 8: copy(soundFile, charsmax(soundFile), gsz9);
			case 9: copy(soundFile, charsmax(soundFile), gsz10);
			case 10: copy(soundFile, charsmax(soundFile), gsz11);
			case 11: copy(soundFile, charsmax(soundFile), gsz12);
		}
		if (!soundFile[0]) continue;
		formatex(fullSoundPath, charsmax(fullSoundPath), "sound/%s", soundFile);
		if (file_exists(fullSoundPath)) precache_sound(soundFile);
	}
}
public plugin_init()
{
	register_plugin(PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_AUTHOR);
	register_cvar("bm_muzacooldown", "20.0");
	register_cvar("bm_muzatime", "20.0");
 
	RegisterSayCmd("/rcm",			"CmdMainMenu");
	register_clcmd("BCM_SetRendering",	"SetRenderingBlock",	-1);
	new command[32] =			"CmdShowInfo";
	RegisterSayCmd("BM",			command);
	RegisterSayCmd("Info",		        command);
	RegisterSayCmd("Help",		        command);
 
	command =				"CmdSaveCheckpoint";
	RegisterSayCmd("cp",			command);
	RegisterSayCmd("savecp",		command);
	RegisterSayCmd("checkpoint",		command);
	RegisterSayCmd("savecheckpoint",	command);
 
	command =				"CmdLoadCheckpoint";
	RegisterSayCmd("tp",			command);
	RegisterSayCmd("gocheck",		command);
	RegisterSayCmd("teleport",		command);
	RegisterSayCmd("loadcheck",		command);
	RegisterSayCmd("teleportcp",		command);
	RegisterSayCmd("gocheckpoint",		command);
	RegisterSayCmd("loadcheckpoint",	command);
 
	command =				"CmdReviveYourself";
	RegisterSayCmd("rs",			command);
	RegisterSayCmd("spawn",			command);
	RegisterSayCmd("revive",		command);
	RegisterSayCmd("respawn",		command);
	RegisterSayCmd("restart",		command);
 
	register_clcmd("BCM_SetProperty",	"SetPropertyBlock",	-1);
	register_clcmd("BCM_SetLightProperty",	"SetPropertyLight",	-1);
	register_clcmd("BCM_Revive",		"RevivePlayer",		-1);
	register_clcmd("BCM_GiveAccess",	"GiveAccess",		-1);
 
	command =				"CmdGrab";
	register_clcmd("+bmgrab",		command,		-1, g_blank);
	register_clcmd("+bmgrab",		command,		-1, g_blank);
 
	command =				"CmdRelease";
	register_clcmd("-bmgrab",		command,		-1, g_blank);
	register_clcmd("-bmgrab",		command,		-1, g_blank);
 
	register_clcmd("bm_noclip_toggle",	"CmdNoclipToggle");
	register_clcmd("bm_noclip_speed",	"CmdNoclipSpeed");
 
	for ( new i = 1; i <= 32; i++ )
	{
		g_noclip_mul[i] = 1;
	}
 
	CreateMenus();
 
	register_event("ResetHUD", "ResetHUD", "abe");
 
	register_menucmd(register_menuid("BcmMainMenu"),		g_keys_main_menu,		"HandleMainMenu");
	register_menucmd(register_menuid("BcmBlockMenu"),		g_keys_block_menu,		"HandleBlockMenu");
	register_menucmd(register_menuid("BcmBlockSelectionMenu"),	g_keys_block_selection_menu,	"HandleBlockSelectionMenu");
	register_menucmd(register_menuid("BcmPropertiesMenu"),		g_keys_properties_menu,		"HandlePropertiesMenu");
	register_menucmd(register_menuid("BcmMoveMenu"),		g_keys_move_menu,		"HandleMoveMenu");
	register_menucmd(register_menuid("BcmTeleportMenu"),		g_keys_teleport_menu,		"HandleTeleportMenu");
	register_menucmd(register_menuid("BcmLightMenu"),		g_keys_light_menu,		"HandleLightMenu");
	register_menucmd(register_menuid("BcmLightPropertiesMenu"),	g_keys_light_properties_menu,	"HandleLightPropertiesMenu");
	register_menucmd(register_menuid("BcmOptionsMenu"),		g_keys_options_menu,		"HandleOptionsMenu");
	register_menucmd(register_menuid("BcmChoiceMenu"),		g_keys_choice_menu,		"HandleChoiceMenu");
	register_menucmd(register_menuid("BcmCommandsMenu"),		g_keys_commands_menu,		"HandleCommandsMenu");
	register_menucmd(register_menuid("bmRenderMenu"), gRenderMenuKeys, "HandleRenderMenu");
	register_menucmd(register_menuid("bmFlyMenu"), 	gKeysFlyMenu, "handleFlyMenu");
	register_menucmd(register_menuid("BcmWeaponsMenu"),		g_keys_weapons_menu,		"HandleWeaponsMenu");
	//register_menucmd(register_menuid("BcmWeaponsMenu2"),		g_keys_weapons_menu2,		"HandleWeaponsMenu2");
	//register_menucmd(register_menuid("BcmWeaponsMenu3"),		g_keys_weapons_menu3,		"HandleWeaponsMenu3");
 
 
	RegisterHam(Ham_Spawn,		"player",	"FwdPlayerSpawn",	1);
	RegisterHam(Ham_Killed,		"player",	"FwdPlayerKilled",	1);
 
	register_forward(FM_CmdStart,			"FwdCmdStart");
 
	register_think(g_light_classname,		"LightThink");
	register_think(g_block_classname,		"THINK_BLOCK");
 
	register_event("CurWeapon",			"EventCurWeapon",	"be");
 
	register_message(get_user_msgid("StatusValue"),	"MsgStatusValue");
 
	g_cvar_textures =	register_cvar("BCM_Textures", "Reverse", 0, 0.0);
 
	g_max_players =		get_maxplayers();
 
	new dir[64];
	get_datadir(dir, charsmax(dir));
 
	new folder[64];
	formatex(folder, charsmax(folder), "/%s", PLUGIN_PREFIX);
 
	add(dir, charsmax(dir), folder);
	if ( !dir_exists(dir) ) mkdir(dir);
 
	new map[32];
	get_mapname(map, charsmax(map));
 
	formatex(g_file, charsmax(g_file), "%s/%s.%s", dir, map, PLUGIN_PREFIX);
}
public ResetHUD(id)
{
	if (is_user_connected(id) && is_user_alive(id))
	{	
		set_task(0.01, "pobierzhp",id);
	}
}
public pobierzhp(id)
{
	if(is_user_alive(id))
	{
		maxhp[id] = get_user_health(id);
	}
}
public plugin_cfg()
{
	LoadBlocks(0);
}
public client_putinserver(id)
{
	g_connected[id] =			bool:!is_user_hltv(id);
	g_alive[id] =				false;
 
	g_admin[id] =				bool:access(id, ADMIN_LEVEL_H);
	g_gived_access[id] =			false;
 
	g_viewing_properties_menu[id] =		false;
	g_viewing_light_properties_menu[id] =	false;
	g_viewing_commands_menu[id] =		false;
 
	g_snapping[id] =			true;
 
	g_grid_size[id] =			1.0;
	g_snapping_gap[id] =			0.0;
 
	g_group_count[id] =			0;
 
	g_noclip[id] =				false;
	g_noclip_mul[id] =			1;
	g_godmode[id] =				false;
 
	g_has_checkpoint[id] =			false;
	g_checkpoint_duck[id] =			false;
 
	g_reseted[id] =				false;
	gTyp[id] =				TRANSALPHA;
	g_weapons_page[id] = 1;
	ResetPlayer(id);
}
 
public client_disconnect(id)
{
	g_connected[id] =			false;
	g_alive[id] =				false;
 
	ClearGroup(id);
 
	if ( g_grabbed[id] )
	{
		if ( is_valid_ent(g_grabbed[id]) )
		{
			entity_set_int(g_grabbed[id], EV_INT_iuser2, 0);
		}
 
		g_grabbed[id] =			0;
	}
}
 
RegisterSayCmd(const command[], const handle[])
{
	static temp[64];
 
	register_clcmd(command, handle, -1, g_blank);
 
	formatex(temp, charsmax(temp), "say /bm", command);
	register_clcmd(temp, handle, -1, g_blank);
 
	formatex(temp, charsmax(temp), "say_team /bm", command);
	register_clcmd(temp, handle, -1, g_blank);
}
 
CreateMenus()
{
	g_block_selection_pages_max = floatround((float(TOTAL_BLOCKS) / 8.0), floatround_ceil);
	new size = charsmax(g_weapons_menu);
	add(g_weapons_menu, size, "\r[%s] \y%s \rv%s^n^n");
	add(g_weapons_menu, size, "\r1. \wp228^n");
	add(g_weapons_menu, size, "\r2. \wScout^n");
	add(g_weapons_menu, size, "\r3. \wXm1014^n");
	add(g_weapons_menu, size, "\r4. \wMac10^n");
	add(g_weapons_menu, size, "\r5. \wAug^n");
	add(g_weapons_menu, size, "\r6. \wElite^n");
	add(g_weapons_menu, size, "\r7. \wFiveseven^n");
	add(g_weapons_menu, size, "\r8. \wUmp45^n");
	add(g_weapons_menu, size, "\r9. \wDalej^n");
	add(g_weapons_menu, size, "\r0. \wWyjscie");
	g_keys_weapons_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
 
	size = charsmax(g_weapons_menu2);
	add(g_weapons_menu2, size, "\r[%s] \y%s \rv%s^n^n");
	add(g_weapons_menu2, size, "\r1. \wsg550^n");
	add(g_weapons_menu2, size, "\r2. \wgalil^n");
	add(g_weapons_menu2, size, "\r3. \wfamas^n");
	add(g_weapons_menu2, size, "\r4. \wusp^n");
	add(g_weapons_menu2, size, "\r5. \wglock^n");
	add(g_weapons_menu2, size, "\r6. \wawp^n");
	add(g_weapons_menu2, size, "\r7. \wmp5^n");
	add(g_weapons_menu2, size, "\r8. \wm249^n");
	add(g_weapons_menu2, size, "\r9. \wDalej^n");
	add(g_weapons_menu2, size, "\r0. \wWstecz");
	g_keys_weapons_menu2 =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
 
	size = charsmax(g_weapons_menu3);
	add(g_weapons_menu3, size, "\r[%s] \y%s \rv%s^n^n");
	add(g_weapons_menu3, size, "\r1. \wm3^n");
	add(g_weapons_menu3, size, "\r2. \wm4a1^n");
	add(g_weapons_menu3, size, "\r3. \wtmp^n");
	add(g_weapons_menu3, size, "\r4. \wg3sg1^n");
	add(g_weapons_menu3, size, "\r5. \wdeagle^n");
	add(g_weapons_menu3, size, "\r6. \wsg552^n");
	add(g_weapons_menu3, size, "\r7. \wak47^n");
	add(g_weapons_menu3, size, "\r8. \wWstecz^n");
	add(g_weapons_menu3, size, "\r9. \wDalej^n");
	add(g_weapons_menu3, size, "\r0. \wWyjdz");
	g_keys_weapons_menu3 =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
 
	size = charsmax(g_weapons_menu4);
	add(g_weapons_menu4, size, "\r[%s] \y%s \rv%s^n^n");
	add(g_weapons_menu4, size, "\r1. \wGranat HE^n");
	add(g_weapons_menu4, size, "\r2. \wFlashbang^n");
	add(g_weapons_menu4, size, "\r3. \wGranat Dymny^n");
	add(g_weapons_menu4, size, "\r4. \wP90^n");
	add(g_weapons_menu4, size, "\r9. \wWstecz^n");
	add(g_weapons_menu4, size, "\r0. \wWyjdz");
	g_keys_weapons_menu4 =		B1 | B2 | B3 | B4 | B9 | B0;
 
	size = charsmax(g_main_menu);
	add(g_main_menu, size, "\r[%s] \y%s \rv%s^n^n");
	add(g_main_menu, size, "\r1. \wMenu Blokow^n");
	add(g_main_menu, size, "\r2. \wMenu Teleportu^n");
	add(g_main_menu, size, "\r3. \wMenu Swiatel^n");
	add(g_main_menu, size, "\r4. \wMenu Opcji^n");
	add(g_main_menu, size, "\r5. \wMenu Komend^n^n");
	add(g_main_menu, size, "%s6. %sNoclip: %s^n");
	add(g_main_menu, size, "%s7. %sGodmode: %s^n");
	add(g_main_menu, size, "%s8. %sRendering ^n^n");
	add(g_main_menu, size, "\r9. \wPomoc^n");
	add(g_main_menu, size, "\r0. \wZamknij");
	g_keys_main_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
 
	size = charsmax(g_block_menu);
	add(g_block_menu, size, "\r[%s] \yMenu Blokow^n^n");
	add(g_block_menu, size, "\r1. \wTyp Bloku: \y%s^n");
	add(g_block_menu, size, "\r2. \wWielkosc Bloku: \y%s^n^n");
	add(g_block_menu, size, "%s3. %sUtworz^n");
	add(g_block_menu, size, "%s4. %sPodmien^n");
	add(g_block_menu, size, "%s5. %sUsun^n");
	add(g_block_menu, size, "%s6. %sObroc^n");
	add(g_block_menu, size, "%s7. %sWlasciwosci Bloka^n");
	add(g_block_menu, size, "%s8. %sPrzesun^n");
	add(g_block_menu, size, "%s9. %sMenu Lotu^n^n");
	add(g_block_menu, size, "\r0. \wWroc");
	g_keys_block_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
	g_keys_block_selection_menu =	B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B0;
	g_keys_properties_menu =	B1 | B2 | B3 | B4 | B0;
 
	size = charsmax(g_move_menu);
	add(g_move_menu, size, "\r[%s] \yPrzesun^n^n");
	add(g_move_menu, size, "\r1. \wOdleglosc: \y%.1f^n^n");
	add(g_move_menu, size, "\r2. \wZ\y+^n");
	add(g_move_menu, size, "\r3. \wZ\r-^n");
	add(g_move_menu, size, "\r4. \wX\y+^n");
	add(g_move_menu, size, "\r5. \wX\r-^n");
	add(g_move_menu, size, "\r6. \wY\y+^n");
	add(g_move_menu, size, "\r7. \wY\r-^n^n^n");
	add(g_move_menu, size, "\r0. \wWroc");
	g_keys_move_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B0;
 
	size = charsmax(g_teleport_menu);
	add(g_teleport_menu, size, "\r[%s] \yMenu Teleportu^n^n");
	add(g_teleport_menu, size, "%s1. %sStworz wejscie^n");
	add(g_teleport_menu, size, "%s2. %sStworz wyjscie^n^n");
	add(g_teleport_menu, size, "%s3. %sUsun teleport^n^n");
	add(g_teleport_menu, size, "%s4. %sZamien Poczatek/Koniec^n^n");
	add(g_teleport_menu, size, "%s5. %sPokaz sciezke teleportu^n^n^n");
	add(g_teleport_menu, size, "\r0. \wWroc");
	g_keys_teleport_menu =		B1 | B2 | B3 | B4 | B5 | B0;
 
	size = charsmax(g_light_menu);
	add(g_light_menu, size, "\r[%s] \yMenu Swiatel^n^n");
	add(g_light_menu, size, "%s1. %sStworz^n");
	add(g_light_menu, size, "%s2. %sUsun^n^n");
	add(g_light_menu, size, "%s3. %sUstaw Wlasciwosci^n^n^n^n^n^n^n");
	add(g_light_menu, size, "\r0. \wWroc");
	g_keys_light_menu =		B1 | B2 | B3 | B0;
 
	size = charsmax(g_light_properties_menu);
	add(g_light_properties_menu, size, "\r[%s] \yZmien Wlasciwosci^n^n");
	add(g_light_properties_menu, size, "\r1. \wZasieg: \y%s^n");
	add(g_light_properties_menu, size, "\r2. \wCzerwony Kolor: \y%s^n");
	add(g_light_properties_menu, size, "\r3. \wZielony Kolor: \y%s^n");
	add(g_light_properties_menu, size, "\r4. \wNiebieski Kolor: \y%s^n^n^n^n^n^n^n");
	add(g_light_properties_menu, size, "\r0. \wWroc");
	g_keys_light_properties_menu =	B1 | B2 | B3 | B4 | B0;
 
	size = charsmax(g_options_menu);
	add(g_options_menu, size, "\r[%s] \yMenu Opcji^n^n");
	add(g_options_menu, size, "%s1. %sZaspajanie: %s^n");
	add(g_options_menu, size, "%s2. %sOdleglosc zaspajania: \y%.1f^n^n");
	add(g_options_menu, size, "%s3. %sDodaj do grupy^n");
	add(g_options_menu, size, "%s4. %sWyczysc grupe^n^n");
	add(g_options_menu, size, "%s5. %sUsun wszystko^n");
	add(g_options_menu, size, "%s6. %sZapisz^n");
	add(g_options_menu, size, "%s7. %sWczytaj^n^n");
	add(g_options_menu, size, "\r0. \wWroc");
	g_keys_options_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B0;
 
	size = charsmax(g_choice_menu);
	add(g_choice_menu, size, "\y%s^n^n");
	add(g_choice_menu, size, "\r1. \wTak^n");
	add(g_choice_menu, size, "\r2. \wNie^n^n^n^n^n^n^n^n^n");
	g_keys_choice_menu =		B1 | B2;
 
	size = charsmax(g_commands_menu);
	add(g_commands_menu, size, "\r[%s] \yMenu Komend^n^n");
	add(g_commands_menu, size, "%s1. %sZapisz Checkpoint^n");
	add(g_commands_menu, size, "%s2. %sWczytaj Checkpoint^n^n");
	add(g_commands_menu, size, "%s3. %sOdrodz siebie^n");
	add(g_commands_menu, size, "%s4. %sOdrodz gracza^n");
	add(g_commands_menu, size, "%s5. %sOdrodz Wszystkich^n^n");
	add(g_commands_menu, size, "%s6. %s%s Niesmiertelnosc %s Wszytkim^n");
	add(g_commands_menu, size, "%s7. %sDaj Uprawnienie do %s^n^n");
	add(g_commands_menu, size, "\r0. \wWroc");
	g_keys_commands_menu =		B1 | B2 | B3 | B4 | B5 | B6 | B7 | B0;
 
	size = sizeof(gRenderMenu);
	add(gRenderMenu, size, "\rRendering^n^n");
	add(gRenderMenu, size, "\r1. \wUstaw^n");
	add(gRenderMenu, size, "\r2. \wTyp: \r%s^n");
	add(gRenderMenu, size, "\r3. \wWidzialnosc: \y%d^n");
	add(gRenderMenu, size, "\r4. \wCzerwony: \y%d^n");
	add(gRenderMenu, size, "\r5. \wZielony: \y%d^n");
	add(gRenderMenu, size, "\r6. \wNiebieski: \y%d^n");
	add(gRenderMenu, size, "\r0. \wWroc");
	gRenderMenuKeys = B1 | B2 | B3 | B4| B5 | B6 | B0;
 
	size = charsmax(gszFlyMenu);
	add(gszFlyMenu, size, "Opcje latania bloku^n^n");
	add(gszFlyMenu, size, "\r1. %sOs Z (%d)^n");
	add(gszFlyMenu, size, "\r2. %sOs X (%d)^n");
	add(gszFlyMenu, size, "\r3. %sOs Y (%d)^n");
	add(gszFlyMenu, size, "\r4. \wObszar latania:\y %d^n");
	add(gszFlyMenu, size, "\r5. \wZastosuj^n^n");
	add(gszFlyMenu, size, "\r0. \wPowrot");
	gKeysFlyMenu = B1 | B2 | B3 | B4 | B5 | B0;
}
 
SetupBlockRendering(block_type, render_type, red, green, blue, alpha)
{
	g_render[block_type] =		render_type;
	g_red[block_type] =		red;
	g_green[block_type] =		green;
	g_blue[block_type] =		blue;
	g_alpha[block_type] =		alpha;
}
 
public FwdPlayerSpawn(id)
{
	if ( !is_user_alive(id) ) return HAM_IGNORED;
 
	g_alive[id] =			true;
 
	if ( g_noclip[id] )		set_user_noclip(id, 1);
	if ( g_godmode[id] )		set_user_godmode(id, 1);
 
	if ( g_all_godmode )
	{
		for ( new i = 1; i <= g_max_players; i++ )
		{
			if ( !g_alive[i]
			|| g_admin[i]
			|| g_gived_access[i] ) continue;
 
			entity_set_float(i, EV_FL_takedamage, DAMAGE_NO);
		}
	}
 
	if ( g_viewing_commands_menu[id] ) ShowCommandsMenu(id);
 
	if ( !g_reseted[id] )
	{
		ResetPlayer(id);
	}
 
	g_reseted[id] =			false;
 
	return HAM_IGNORED;
}
 
public FwdPlayerKilled(id)
{
	g_alive[id] = bool:is_user_alive(id);
 
	ResetPlayer(id);
 
	if ( g_viewing_commands_menu[id] ) ShowCommandsMenu(id);
}
 
public FwdCmdStart(id, handle)
{
	if ( !g_connected[id] ) return FMRES_IGNORED;
 
	static buttons, oldbuttons;
	buttons =	get_uc(handle, UC_Buttons);
	oldbuttons =	entity_get_int(id, EV_INT_oldbuttons);
 
	if ( g_alive[id]
	&& ( buttons & IN_USE )
	&& !( oldbuttons & IN_USE )
	&& !g_has_hud_text[id] )
	{
		static ent, body;
		get_user_aiming(id, ent, body, 9999);
 
		if ( IsBlock(ent) )
		{
			static block_type;
			block_type = entity_get_int(ent, EV_INT_body);
 
			static property[13];
 
			static message[512], len;
			len = format(message, charsmax(message), "%s^nTyp: %s", PLUGIN_PREFIX, g_block_names[block_type]);
 
			if ( g_property1_name[block_type][0] )
			{
				GetProperty(ent, 1, property);
 
				if ( ( block_type == BUNNYHOP
				|| block_type == NO_SLOW_DOWN_BUNNYHOP)
				&& property[0] == '1' )
				{
					len += format(message[len], charsmax(message) - len, "^n%s", g_property1_name[block_type]);
				}
				else if(block_type == DEATH)
				{
					len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property1_name[block_type], property[0] == '1' ? "Tak" : "Nie");
				}
				else if(block_type == BRON)
				{
					len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property1_name[block_type], property[0]);
				}
				else if ( block_type != BUNNYHOP
				&& block_type != NO_SLOW_DOWN_BUNNYHOP )
				{
					len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property1_name[block_type], property);
				}
			}
			if ( g_property2_name[block_type][0] )
			{
				GetProperty(ent, 2, property);
 
				len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property2_name[block_type], property);
			}
			if ( g_property3_name[block_type][0] )
			{
				GetProperty(ent, 3, property);
 
				if (block_type == BOOTS_OF_SPEED)
				{
					len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property3_name[block_type], property);
				}
			}
			if ( g_property4_name[block_type][0] )
			{
				GetProperty(ent, 4, property);
 
				len += format(message[len], charsmax(message) - len, "^n%s: %s", g_property4_name[block_type], property[0] == '1' ? "Tak" : "Nie");
			}
 
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, message);
		}
		else if ( IsLight(ent) )
		{
			static property1[5], property2[5], property3[5], property4[5];
 
			GetProperty(ent, 1, property1);
			GetProperty(ent, 2, property2);
			GetProperty(ent, 3, property3);
			GetProperty(ent, 4, property4);
 
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nTyp: Swiatlo^nZasieg: %s^nRed: %s^nGreen: %s^nBlue: %s", PLUGIN_PREFIX, property1, property2, property3, property4);
		}
	}
 
	if ( !g_grabbed[id] ) return FMRES_IGNORED;
 
	if ( ( buttons & IN_JUMP )
	&& !( oldbuttons & IN_JUMP ) ) if ( g_grab_length[id] > 72.0 ) g_grab_length[id] -= 16.0;
 
	if ( ( buttons & IN_DUCK )
	&& !( oldbuttons & IN_DUCK ) ) g_grab_length[id] += 16.0;
 
	if ( ( buttons & IN_ATTACK )
	&& !( oldbuttons & IN_ATTACK ) ) CmdAttack(id);
 
	if ( ( buttons & IN_ATTACK2 )
	&& !( oldbuttons & IN_ATTACK2 ) ) CmdAttack2(id);
 
	if ( ( buttons & IN_RELOAD )
	&& !( oldbuttons & IN_RELOAD ) )
	{
		CmdRotate(id);
		set_uc(handle, UC_Buttons, buttons & ~IN_RELOAD);
	}
 
	if ( !is_valid_ent(g_grabbed[id]) )
	{
		CmdRelease(id);
		return FMRES_IGNORED;
	}
 
	if ( !IsBlockInGroup(id, g_grabbed[id])
	|| g_group_count[id] < 1 )
	{
		MoveGrabbedEntity(id);
		return FMRES_IGNORED;
	}
 
	static block;
	static Float:move_to[3];
	static Float:offset[3];
	static Float:origin[3];
 
	MoveGrabbedEntity(id, move_to);
 
	for ( new i = 0; i <= g_group_count[id]; ++i )
	{
		block = g_grouped_blocks[id][i];
 
		if ( !IsBlockInGroup(id, block) ) continue;
 
		entity_get_vector(block, EV_VEC_vuser1, offset);
 
		origin[0] = move_to[0] - offset[0];
		origin[1] = move_to[1] - offset[1];
		origin[2] = move_to[2] - offset[2];
 
		MoveEntity(id, block, origin, false);
	}
 
	return FMRES_IGNORED;
}
 
public EventCurWeapon(id)
{
	static block, property[5];
	if(g_melanz[id])
	{
		entity_set_float(id, EV_FL_maxspeed, g_speedmelanz[id]);
	}
	else if ( g_boots_of_speed[id] )
	{
		block = g_boots_of_speed[id];
		GetProperty(block, 3, property);
 
		entity_set_float(id, EV_FL_maxspeed, str_to_float(property));
	}
	else if ( g_ice[id] )
	{
		entity_set_float(id, EV_FL_maxspeed, 400.0);
	}
	else if ( g_honey[id] )
	{
		block = g_honey[id];
		GetProperty(block, 1, property);
 
		entity_set_float(id, EV_FL_maxspeed, str_to_float(property));
	}
}
 
public pfn_touch(ent, id)
{
	if ( !( 1 <= id <= g_max_players )
	|| !g_alive[id]
	|| !IsBlock(ent) ) return PLUGIN_CONTINUE;
 
	new block_type =	entity_get_int(ent, EV_INT_body);
	if ( block_type == PLATFORM
	|| block_type == GLASS 
	|| block_type == TRAWA
	|| block_type == DREWNO) return PLUGIN_CONTINUE;
 
	new flags =		entity_get_int(id, EV_INT_flags);
	new groundentity =	entity_get_edict(id, EV_ENT_groundentity);
 
	static property[5];
	GetProperty(ent, 4, property);
 
	if ( property[0] == '0'
	|| ( ( !property[0]
	|| property[0] == '1'
	|| property[0] == '/' )
	&& ( flags & FL_ONGROUND )
	&& groundentity == ent ) )
	{
		switch ( block_type )
		{
			case BUNNYHOP, NO_SLOW_DOWN_BUNNYHOP:	ActionBhop(ent);
			case DAMAGE:				ActionDamage(id, ent);
			case HEALER:				ActionHeal(id, ent);
			case ARMOR:					ActionArmor(id, ent);
			case TRAMPOLINE:			ActionTrampoline(id, ent);
			case SPEED_BOOST:			ActionSpeedBoost(id, ent);
			case DEATH:
			{
				GetProperty(ent, 1, property);
				if(property[0] == '0')
				{
					if(!get_user_godmode(id))
						fakedamage(id, "The Block of Death", 10000.0, DMG_GENERIC);
				}
				else if(property[0] == '1')
				{
					if(entity_get_float(id, EV_FL_takedamage) == DAMAGE_NO)
						entity_set_float(id, EV_FL_takedamage, DAMAGE_YES);
 
					fakedamage(id, "The Block of Death", 10000.0, DMG_GENERIC);
				}
			}
			case HONEY:				ActionHoney(id, ent);
			case CT_BARRIER:			ActionBarrier(id, ent, true);
			case T_BARRIER:				ActionBarrier(id, ent, false);
			case DELAYED_BUNNYHOP:			ActionDelayedBhop(ent);
			case STEALTH:				ActionStealth(id, ent);
			case INVINCIBILITY:			ActionInvincibility(id, ent);
			case BOOTS_OF_SPEED:			ActionBootsOfSpeed(id, ent);
			case KAMUFLAZ:				ActionCamouflage(id,ent);
			case BRON:				ActionBron(id, ent);
			case SPAMDUCK:				ActionSpamDuck(id);
			case GRANATY:				ActionGranaty(id, ent);
			case VIP:				ActionVIP(id, ent);
			case OSLEPIENIE:			ActionOslep(id, ent);
			case TRZESIENIE:			ActionShejk(id, ent);
			case MELANZ:				ActionImpreza(id, ent);
			case EXP:				ActionExp(id,ent);
			case MUZA:				ActionMuza(id,ent);
			case BHDAMAGE:				ActionObrazenia(id, ent);
			case BHICE:				ActionBhice(id, ent);
 
			case HE:				ActionGranat(id, ent, 0);
			case SG:				ActionGranat(id, ent, 1);
			case FLASH:				ActionGranat(id, ent, 2);
			case CARPET: 
			{
				new origin[2][3];
				pev(id, pev_origin, origin[0]);
				pev(ent, pev_origin, origin[1]);
 
				origin[1][0] = origin[0][0];
				origin[1][1] = origin[0][1];
 
				set_pev(ent, pev_origin, origin[1]);
				set_pev(ent, pev_movetype, MOVETYPE_FLY);
			}
			case LUKE:				ActionLuke(id, ent);
		}
	}
 
	if ( ( flags & FL_ONGROUND )
	&& groundentity == ent )
	{
		switch ( block_type )
		{
			case BUNNYHOP:
			{
				GetProperty(ent, 1, property);
				if ( property[0] == '1' )
				{
					g_no_fall_damage[id] = true;
				}
			}
			case NO_FALL_DAMAGE:			g_no_fall_damage[id] = true;
			case ICE:				ActionIce(id);
			case NO_SLOW_DOWN_BUNNYHOP:
			{
				ActionNoSlowDown(id);
 
				GetProperty(ent, 1, property);
				if ( property[0] == '1' )
				{
					g_no_fall_damage[id] = true;
				}
			}
		}
	}
 
	return PLUGIN_CONTINUE;
}
 
public server_frame()
{
	for ( new id = 1; id <= g_max_players; ++id )
	{
		if ( !g_alive[id] ) continue;
 
		if ( g_ice[id] || g_no_slow_down[id] )
		{
			entity_set_float(id, EV_FL_fuser2, 0.0);
		}
 
		if ( g_set_velocity[id][0] != 0.0
		|| g_set_velocity[id][1] != 0.0
		|| g_set_velocity[id][2] != 0.0 )
		{
			entity_set_vector(id, EV_VEC_velocity, g_set_velocity[id]);
 
			g_set_velocity[id][0] = 0.0;
			g_set_velocity[id][1] = 0.0;
			g_set_velocity[id][2] = 0.0;
		}
	}
 
	static ent;
	static entinsphere;
	static Float:origin[3];
 
	while ( ( ent = find_ent_by_class(ent, g_start_classname) ) )
	{
		entity_get_vector(ent, EV_VEC_origin, origin);
 
		entinsphere = -1;
		while ( ( entinsphere = find_ent_in_sphere(entinsphere, origin, 40.0) ) )
		{
			static classname[32];
			entity_get_string(entinsphere, EV_SZ_classname, classname, charsmax(classname));
 
			if ( 1 <= entinsphere <= g_max_players && g_alive[entinsphere] )
			{
				ActionTeleport(entinsphere, ent);
			}
			else if ( equal(classname, "grenade") )
			{
				entity_set_int(ent, EV_INT_solid, SOLID_NOT);
				entity_set_float(ent, EV_FL_ltime, get_gametime() + 2.0);
			}
			else if ( get_gametime() >= entity_get_float(ent, EV_FL_ltime) )
			{
				entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
			}
		}
	}
 
	static bool:ent_near;
 
	ent_near = false;
	while ( ( ent = find_ent_by_class(ent, g_destination_classname) ) )
	{
		entity_get_vector(ent, EV_VEC_origin, origin);
 
		entinsphere = -1;
		while ( ( entinsphere = find_ent_in_sphere(entinsphere, origin, 64.0) ) )
		{
			static classname[32];
			entity_get_string(entinsphere, EV_SZ_classname, classname, charsmax(classname));
 
			if ( 1 <= entinsphere <= g_max_players && g_alive[entinsphere]
			|| equal(classname, "grenade") )
			{
				ent_near = true;
				break;
			}
		}
 
		if ( ent_near )
		{
			if ( !entity_get_int(ent, EV_INT_iuser2) )
			{
				entity_set_int(ent, EV_INT_solid, SOLID_NOT);
			}
		}
		else
		{
			entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
		}
	}
}
 
public client_PreThink(id)
{
	// Origin before PM_NoClip. The command itself cannot be scaled:
	// PM_CheckParameters clamps it back to maxspeed, and a large command collapses the move.
	if ( g_alive[id] && g_noclip[id] && g_noclip_mul[id] > 1 )
	{
		pev(id, pev_origin, g_noclip_from[id]);
		g_noclip_have_from[id] = true;
	}
	else
	{
		g_noclip_have_from[id] = false;
	}
 
	if ( !g_alive[id] ) return PLUGIN_CONTINUE;
 
	new Float:gametime =			get_gametime();
	new Float:timeleft_invincibility =	g_invincibility_time_out[id] - gametime;
	new Float:timeleft_stealth =		g_stealth_time_out[id] - gametime;
	new Float:timeleft_kamuflaz =		g_kamuflaz_time_out[id] - gametime;
	new Float:timeleft_boots_of_speed =	g_boots_of_speed_time_out[id] - gametime;
	new Float:timeleft_melanz =		g_melanz_time_out[id] - gametime;
 
	if ( timeleft_invincibility >= 0.0
	|| timeleft_stealth >= 0.0
	|| timeleft_boots_of_speed >= 0.0
	|| timeleft_kamuflaz >= 0.0
	|| timeleft_melanz >= 0.0)
	{
		new text[48], text_to_show[256];
 
		format(text, charsmax(text), "%s", PLUGIN_PREFIX);
		add(text_to_show, charsmax(text_to_show), text);
 
		if ( timeleft_invincibility >= 0.0 )
		{
			format(text, charsmax(text), "^nNiesmiertelnosc: %.1f", timeleft_invincibility);
			add(text_to_show, charsmax(text_to_show), text);
		}
 
		if ( timeleft_stealth >= 0.0 )
		{
			format(text, charsmax(text), "^nNiewidzialnosc: %.1f", timeleft_stealth);
			add(text_to_show, charsmax(text_to_show), text);
		}
 
		if ( timeleft_boots_of_speed >= 0.0 )
		{
			format(text, charsmax(text), "^nButy Szybkosci: %.1f", timeleft_boots_of_speed);
			add(text_to_show, charsmax(text_to_show), text);
		}
		if ( timeleft_kamuflaz >= 0.0 )
		{
			format(text, charsmax(text), "^nKamuflaz: %.1f", timeleft_kamuflaz);
			add(text_to_show, charsmax(text_to_show), text);
		}
		if ( timeleft_melanz >= 0.0 )
		{
			format(text, charsmax(text), "^nMelanz: %.1f", timeleft_melanz);
			add(text_to_show, charsmax(text_to_show), text);
		}
 
		set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
		show_hudmessage(id, text_to_show);
 
		g_has_hud_text[id] = true;
	}
	else
	{
		g_has_hud_text[id] = false;
	}
 
	return PLUGIN_CONTINUE;
}
 
public client_PostThink(id)
{
	if ( g_noclip_have_from[id] )
	{
		g_noclip_have_from[id] = false;
 
		if ( g_alive[id] && g_noclip[id] && g_noclip_mul[id] > 1 )
		{
			new Float:origin[3];
			pev(id, pev_origin, origin);
 
			new Float:extra = float(g_noclip_mul[id] - 1);
			origin[0] += (origin[0] - g_noclip_from[id][0]) * extra;
			origin[1] += (origin[1] - g_noclip_from[id][1]) * extra;
			origin[2] += (origin[2] - g_noclip_from[id][2]) * extra;
 
			engfunc(EngFunc_SetOrigin, id, origin);
		}
	}
 
	if ( !g_alive[id] ) return PLUGIN_CONTINUE;
 
	if ( g_no_fall_damage[id] )
	{
		entity_set_int(id,  EV_INT_watertype, -3);
		g_no_fall_damage[id] = false;
	}
 
	return PLUGIN_CONTINUE;
}
ActionBhop(ent)
{
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	set_task(0.1, "TaskSolidNot", TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
ActionSpamDuck(id)
{
	entity_set_int(id, EV_INT_bInDuck, 10);
}
ActionMuza(id, ent)   
{
if (halflife_time() >= gfMuzaTimeOut[id])
{
new Float:fTime = halflife_time();   
new Float:flPropertie1, Float:flPropertie2;
 
pev( ent, pev_fuser1, flPropertie1 );
pev( ent, pev_fuser2, flPropertie2 );
 
new Float:fTimeout = get_cvar_float("bm_muzatime");
 
gfMuzaTimeOut[id] = fTime + fTimeout;
gfMuzaNextUse[id] = fTime + fTimeout + get_cvar_float("bm_muzacooldown");
	new selectedMusic = random_num(0, 11);
	for (new attempt = 0; attempt < 12 && !IsMusicFileAvailable(selectedMusic); attempt++)
		selectedMusic = (selectedMusic + 1) % 12;
	if (IsMusicFileAvailable(selectedMusic))
	{
		switch(selectedMusic)
		{
			case 0: emit_sound(id, CHAN_STREAM, gsz1, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 1: emit_sound(id, CHAN_STREAM, gsz2, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 2: emit_sound(id, CHAN_STREAM, gsz3, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 3: emit_sound(id, CHAN_STREAM, gsz4, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 4: emit_sound(id, CHAN_STREAM, gsz5, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 5: emit_sound(id, CHAN_STREAM, gsz6, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 6: emit_sound(id, CHAN_STREAM, gsz7, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 7: emit_sound(id, CHAN_STREAM, gsz8, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 8: emit_sound(id, CHAN_STREAM, gsz9, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 9: emit_sound(id, CHAN_STREAM, gsz10, 0.8, ATTN_NORM, 0, PITCH_NORM);
			case 10: emit_sound(id, CHAN_STREAM, gsz11, 0.8, ATTN_NORM, 0, PITCH_NORM);
		}
	}
}
}
ActionGranaty(id,ent)
{
	static property[5];
	GetProperty(ent, 1, property);
	new MaxUzyc = str_to_num(property);
 
 
	if (UzylGranaty[id] < MaxUzyc) 
	{ 
		if(!user_has_weapon(id, CSW_HEGRENADE))
		{
			UzylGranaty[id] += 1;
			give_item(id, "weapon_smokegrenade"); 
			give_item(id, "weapon_hegrenade"); 
			give_item(id, "weapon_flashbang"); 
			give_item(id, "weapon_flashbang"); 
		}
	} 
	else
	{
		set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
		show_hudmessage(id, "%s^nDostales juz %d razy^nWiecej nie dostaniesz!", PLUGIN_PREFIX, MaxUzyc);
	}
 
}
 
ActionGranat(id, ent, typ)
{
	static property[5];
	GetProperty(ent, 1, property);
	new MaxUzyc = str_to_num(property);
 
	if (UsedNade[id][typ] < MaxUzyc) 
	{ 
		switch(typ)
		{
			case 0:
			{
				if(!user_has_weapon(id, CSW_HEGRENADE))
				{
					UsedNade[id][typ]++;
					give_item(id, "weapon_hegrenade"); 
				}
			}
			case 1:
			{
				if(!user_has_weapon(id, CSW_SMOKEGRENADE))
				{
					UsedNade[id][typ]++;
					give_item(id, "weapon_smokegrenade"); 
				}
			}
			case 2:
			{
				if(!user_has_weapon(id, CSW_FLASHBANG))
				{
					UsedNade[id][typ]++;
					give_item(id, "weapon_flashbang"); 
				}
			}
		}
	}
	else
	{
		set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
		show_hudmessage(id, "%s^nDostales juz %d razy^nWiecej nie dostaniesz!", PLUGIN_PREFIX, MaxUzyc);
	}
 
}
 
ActionLuke(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_luke_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nLuke Skywalker^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX,  g_luke_next_use[id] - gametime);
		}
		return PLUGIN_HANDLED;
	}
 
	static property[5], property2[5];
	GetProperty(ent, 1, property);
 
	g_luke[id] = 1;
 
	set_task(str_to_float(property) , "EndLuke", id+2674, _, _, "a", (str_to_num(property) * 10));
	set_task(0.1, "lightsaber", id+1337, _, _, "a", (str_to_num(property) * 10));
	emit_sound(id,CHAN_ITEM, "misc/lukeskywalker.wav", 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	GetProperty(ent, 2, property2);
 
	g_luke_next_use[id] = gametime + str_to_float(property) + str_to_float(property2);
	return PLUGIN_HANDLED;
}
 
public EndLuke(id)
{
	id -= 2674;
 
	g_luke[id] = 0;
}
 
public lightsaber(id)
{
	id -= 1337;
 
	if(!g_luke[id])
		remove_task(id+1337);
 
	new vec[3];
	new aimvec[3];
	new lseffvec[3];
	new length;
	new speed = 65;
	get_user_origin(id,vec,1);
	get_user_origin(id,aimvec,2);
	lseffvec[0]=aimvec[0]-vec[0];
	lseffvec[1]=aimvec[1]-vec[1];
	lseffvec[2]=aimvec[2]-vec[2];
	length=sqrt(lseffvec[0]*lseffvec[0]+lseffvec[1]*lseffvec[1]+lseffvec[2]*lseffvec[2]);
	lseffvec[0]=lseffvec[0]*speed/length;
	lseffvec[1]=lseffvec[1]*speed/length;
	lseffvec[2]=lseffvec[2]*speed/length;
 
	new vorigin[3];
 
	for(new a = 1; a <= g_max_players; a++)
	{			
		if(is_user_alive(a))
		{
			get_user_origin(a,vorigin);
			if (get_distance(vec,vorigin)<100)
			{				
				if(a != id)
				{
					if(get_user_team(id) != get_user_team(a))
					{
 
						kill_player(a,id);
						client_print(a, print_chat,"[Ruletka] Oh yeaaa");
 
						new gemido = random_num(0,3);
 
						switch(gemido)
						{
							case 0: emit_sound(a,CHAN_VOICE, "misc/gemido01.wav", VOL_NORM, ATTN_NORM, 0, PITCH_NORM);
							case 1: emit_sound(a,CHAN_VOICE, "misc/gemido02.wav", VOL_NORM, ATTN_NORM, 0, PITCH_NORM);
							case 2: emit_sound(a,CHAN_VOICE, "misc/gemido03.wav", VOL_NORM, ATTN_NORM, 0, PITCH_NORM);
							case 3: emit_sound(a,CHAN_VOICE, "misc/gemido04.wav", VOL_NORM, ATTN_NORM, 0, PITCH_NORM);
						}
					}					
				}						
			}
		}
	}
 
	// beam effect between point and entity
	message_begin( MSG_BROADCAST,SVC_TEMPENTITY);
	write_byte ( 1 );     			//TE_BEAMENTPOINT 1  
	write_short (id);     		// ent 
	write_coord (lseffvec[0]+vec[0]);	//end position 
	write_coord (lseffvec[1]+vec[1]);
	write_coord (lseffvec[2]+vec[2]+10);
	write_short (g_sprite_saber);  		// sprite 
	write_byte (0);       			// start frame 
	write_byte (15);      			// frame rate in 0.1's 
	write_byte (1);     			// byte (life in 0.1's 
	write_byte (20);      			// line width in 0.1's
	write_byte (5);      			// noise amplitude in 0.01's 
	write_byte (0);       			// RGB color
	write_byte (255);
	write_byte (0);
	write_byte (255);     			// brightness
	write_byte (10);      			// scroll speed in 0.1's
	message_end();
 
	return PLUGIN_CONTINUE;
}
 
public kill_player(id,attacker_id)
{
	if( is_user_alive(id))
	{
		new origin[3];
		new attacker_team[2], victim_team[2];
 
		if( attacker_id <= 0 || attacker_id > g_max_players || !is_user_connected(id) || !is_user_connected(attacker_id) )
			return PLUGIN_CONTINUE;
 
		get_user_origin ( id, origin );
 
		// kill victim
		user_silentkill  ( id );
		message_begin ( MSG_ALL, get_user_msgid("DeathMsg"), {0, 0, 0}, 0 );
		write_byte(attacker_id);
		write_byte(id);
		write_byte(0);
		write_string("lightsaber");
		message_end();
 
		// Save Hummiliation
		new namea[24],namev[24],authida[20],authidv[20],teama[8],teamv[8];
 
		// Info On Attacker
		get_user_name ( attacker_id, namea, 23 );
		get_user_team ( attacker_id, teama, 7 );
		get_user_authid ( attacker_id, authida, 19 );
 
		// Info On Victim
		get_user_name ( id, namev, 23 ); 
		get_user_team ( id, teamv, 7 );
		get_user_authid ( id, authidv, 19 );
 
		// Log This Kill
		log_message ( "^"%s<%d><%s><%s>^" killed ^"%s<%d><%s><%s>^"", namea, get_user_userid ( attacker_id ), authida, teama, namev, get_user_userid ( id ), authidv, teamv );		  
 
		// Check team 
		get_user_team ( attacker_id, attacker_team, 1 );
		get_user_team ( id, victim_team, 1 );
 
	}
	return PLUGIN_CONTINUE;
}
 
public sqrt(num)
{
	new div = num;
	new result = 1;
 
	while (div > result)			// end when div == result, or just below 
	{
		div = (div + result) / 2;	// take mean value as new divisor 
		result = num / div;
	}
 
	return div;
}
 
ActionObrazenia(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_next_damage_time[id] )
	|| get_user_health(id) <= 0
	|| get_user_godmode(id) ) return PLUGIN_HANDLED;
 
	static property[5];
 
	GetProperty(ent, 1, property);
	fakedamage(id, "Damage Block2", str_to_float(property), DMG_CRUSH);
 
	g_next_damage_time[id] = halflife_time() + 0.5;
 
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	set_task(0.1, "TaskSolidNot", TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
ActionBron(id, ent){
	if(is_user_alive(id) && is_user_connected(id) && get_user_team(id) == 1){
		new property[13];
		new bron = GetProperty(ent, 1, property);
		new szWeapon[32];
		format(szWeapon, 31, "weapon_%s", bron);
		replace_all(szWeapon, 31, "", "");
		new iWeapons[32], iNum;
		if (!(get_user_weapons(id, iWeapons, iNum)&(1<<get_weaponid(szWeapon)))){
			new zomk[10];
			GetProperty(ent, 1, zomk);
			if(equal(zomk, "p228") && BronUsed[0][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "scout") && BronUsed[1][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "xm1014") && BronUsed[2][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "mac10") && BronUsed[3][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "aug") && BronUsed[4][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "elite") && BronUsed[5][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "fiveseven") && BronUsed[6][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "ump45") && BronUsed[7][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "sg550") && BronUsed[8][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "galil") && BronUsed[9][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "famas") && BronUsed[10][id]) return PLUGIN_CONTINUE;	
			else if(equal(zomk, "usp") && BronUsed[11][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "glock18") && BronUsed[12][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "awp") && BronUsed[13][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "mp5navy") && BronUsed[14][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "m249") && BronUsed[15][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "m3") && BronUsed[16][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "m4a1") && BronUsed[17][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "tmp") && BronUsed[18][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "g3sg1") && BronUsed[19][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "deagle") && BronUsed[20][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "sg552") && BronUsed[21][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "ak47") && BronUsed[22][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "p90") && BronUsed[23][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "hegrenade") && BronUsed[24][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "flashbang") && BronUsed[25][id]) return PLUGIN_CONTINUE;
			else if(equal(zomk, "smokegrenade") && BronUsed[26][id]) return PLUGIN_CONTINUE;
 
			give_item(id, szWeapon);
			GetProperty(ent, 2, property);
			new naboje = str_to_num(property);
			if(equal(zomk, "hegrenade"))
				cs_set_user_bpammo(id, CSW_HEGRENADE, naboje);
			else if(equal(zomk, "smokegrenade"))
				cs_set_user_bpammo(id, CSW_SMOKEGRENADE, naboje);
			else if(equal(zomk, "flashbang"))
				cs_set_user_bpammo(id, CSW_FLASHBANG, naboje);
			else cs_set_weapon_ammo(find_ent_by_owner(-1, szWeapon, id), naboje);
 
			emit_sound(id, CHAN_STATIC, g_sound_bron, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
			if(equal(zomk, "p228")) BronUsed[0][id] = true;
			else if(equali(zomk, "scout")) BronUsed[1][id] = true;
			else if(equal(zomk, "xm1014")) BronUsed[2][id] = true;
			else if(equal(zomk, "mac10")) BronUsed[3][id] = true;
			else if(equal(zomk, "aug")) BronUsed[4][id] = true;
			else if(equal(zomk, "elite")) BronUsed[5][id] = true;
			else if(equal(zomk, "fiveseven")) BronUsed[6][id] = true;
			else if(equal(zomk, "ump45")) BronUsed[7][id] = true;
			else if(equal(zomk, "sg550")) BronUsed[8][id] = true;
			else if(equal(zomk, "galil")) BronUsed[9][id] = true;
			else if(equal(zomk, "famas")) BronUsed[10][id] = true;
			else if(equal(zomk, "usp")) BronUsed[11][id] = true;
			else if(equal(zomk, "glock18")) BronUsed[12][id] = true;
			else if(equal(zomk, "awp")) BronUsed[13][id] = true;
			else if(equal(zomk, "mp5navy")) BronUsed[14][id] = true;
			else if(equal(zomk, "m249")) BronUsed[15][id] = true;
			else if(equal(zomk, "m3")) BronUsed[16][id] = true;
			else if(equal(zomk, "m4a1")) BronUsed[17][id] = true;
			else if(equal(zomk, "tmp")) BronUsed[18][id] = true;
			else if(equal(zomk, "g3sg1")) BronUsed[19][id] = true;
			else if(equal(zomk, "deagle")) BronUsed[20][id] = true;
			else if(equal(zomk, "sg552")) BronUsed[21][id] = true;
			else if(equal(zomk, "ak47")) BronUsed[22][id] = true;
			else if(equal(zomk, "p90")) BronUsed[23][id] = true;
			else if(equal(zomk, "hegrenade")) BronUsed[24][id] = true;
			else if(equal(zomk, "flashbang")) BronUsed[25][id] = true;
			else if(equal(zomk, "smokegrenade")) BronUsed[26][id] = true;
		}
	}
 
	return PLUGIN_CONTINUE;
}
 
ActionDamage(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_next_damage_time[id] )
	|| get_user_health(id) <= 0
	|| get_user_godmode(id) ) return PLUGIN_HANDLED;
 
	static property[5];
 
	GetProperty(ent, 1, property);
	fakedamage(id, "Damage Block", str_to_float(property), DMG_CRUSH);
 
	GetProperty(ent, 2, property);
	g_next_damage_time[id] = gametime + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
ActionBhice(id, ent)
{
	if ( !g_ice[id] )
	{
		entity_set_float(id, EV_FL_friction, 0.15);
		entity_set_float(id, EV_FL_maxspeed, 400.0);
 
		g_ice[id] = true;
	}
 
	new task_id = TASK_ICE + id;
	if ( task_exists(task_id) ) remove_task(task_id);
 
	set_task(0.1, "TaskNotOnIce", task_id);
 
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	set_task(0.1, "TaskSolidNot", TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
ActionExp(id, ent)
{	
	if (is_user_alive(id) && !KasaUsed[id] && get_user_team(id) == 1)
	{
		new property[5];
		GetProperty(ent, 1, property);
 
		new name[33];
		get_user_name(id, name, 32);
		KasaUsed[id] = true;
 
		set_hudmessage(0, 255, 0, -1.0, 0.20, 0, 6.0, 12.0, 0.0, 1.0, 3);
 
		if(get_user_flags(id) & ADMIN_RESERVATION)
		{
			new kasa_add = str_to_num(property)*2;
			hnsxp_add_user_xp(id, kasa_add);
			BCM_Print(id, "^x03 Dostales^x04 %i expa^x03 na bloku!", kasa_add);
 
			show_hudmessage(0, "Gracz %s Zdobyl %s expa na bloku!", name, property);
		}
		else
		{
			hnsxp_add_user_xp(id, str_to_num(property));
			BCM_Print(id, "^x03 Dostales^x04 %i expa^x03 na bloku!", str_to_num(property));
 
			show_hudmessage(0, "Gracz %s Zdobyl %s expa na bloku!", name, property);
		}
		emit_sound(id, CHAN_STATIC, g_sound_kasa, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	}
	else
	{
		set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
		show_hudmessage(id, "[%s]^nExp: Raz na runde i tylko dla TT", PLUGIN_PREFIX);
	}
}
ActionHeal(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_next_heal_time[id] ) ) return PLUGIN_HANDLED;
 
	new health = get_user_health(id);
	if ( health >= maxhp[id]) return PLUGIN_HANDLED;
 
	static property[5];
 
	GetProperty(ent, 1, property);
	health += str_to_num(property);
	set_user_health(id, min(maxhp[id], health));
 
	GetProperty(ent, 2, property);
	g_next_heal_time[id] = gametime + str_to_float(property);
 
 
	return PLUGIN_HANDLED;
}
ActionArmor(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_next_armor_time[id] ) ) return PLUGIN_HANDLED;
 
	new armor = get_user_armor(id);
	if ( armor >= 100 ) return PLUGIN_HANDLED;
 
	static property[5];
 
	GetProperty(ent, 1, property);
	armor += str_to_num(property);
	set_user_armor(id, min(100, armor));
 
	GetProperty(ent, 2, property);
	g_next_armor_time[id] = gametime + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
 
ActionIce(id)
{
	if ( !g_ice[id] )
	{
		entity_set_float(id, EV_FL_friction, 0.15);
		entity_set_float(id, EV_FL_maxspeed, 400.0);
 
		g_ice[id] = true;
	}
 
	new task_id = TASK_ICE + id;
	if ( task_exists(task_id) ) remove_task(task_id);
 
	set_task(0.1, "TaskNotOnIce", task_id);
}
 
ActionTrampoline(id, ent)
{
	static property1[5];
	GetProperty(ent, 1, property1);
 
	entity_get_vector(id, EV_VEC_velocity, g_set_velocity[id]);
 
	g_set_velocity[id][2] = str_to_float(property1);
 
	entity_set_int(id, EV_INT_gaitsequence, 6);
 
	g_no_fall_damage[id] = true;
}
 
ActionSpeedBoost(id, ent)
{
	static property[5];
 
	GetProperty(ent, 1, property);
	velocity_by_aim(id, str_to_num(property), g_set_velocity[id]);
 
	GetProperty(ent, 2, property);
	g_set_velocity[id][2] = str_to_float(property);
 
	entity_set_int(id, EV_INT_gaitsequence, 6);
}
 
ActionHoney(id, ent)
{
	if ( g_honey[id] != ent )
	{
		static property1[5];
		GetProperty(ent, 1, property1);
 
		new Float:speed = str_to_float(property1);
		entity_set_float(id, EV_FL_maxspeed, speed == 0 ? -1.0 : speed);
 
		g_honey[id] = ent;
	}
 
	new task_id = TASK_HONEY + id;
	if ( task_exists(task_id) )
	{
		remove_task(task_id);
	}
	else
	{
		static Float:velocity[3];
		entity_get_vector(id, EV_VEC_velocity, velocity);
 
		velocity[0] /= 2.0;
		velocity[1] /= 2.0;
 
		entity_set_vector(id, EV_VEC_velocity, velocity);
	}
 
	set_task(0.1, "TaskNotInHoney", task_id);
}
 
ActionBarrier(id, ent, bool:block_terrorists)
{
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	new CsTeams:team = block_terrorists ? CS_TEAM_T : CS_TEAM_CT;
	if ( cs_get_user_team(id) == team ) TaskSolidNot(TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
ActionVIP(id, ent)
{
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	if (get_user_flags(id) & ADMIN_RESERVATION) TaskSolidNot(TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
ActionOslep(id, ent)
{
	static property1[5];
	GetProperty(ent, 1, property1);
	new united = clamp( ( str_to_num(property1) * ( 1 << 12 ) ), 0, 0xFFFF );
	message_begin( MSG_ONE_UNRELIABLE, get_user_msgid( "ScreenFade" ), _, id);
	write_short(united);
	write_short(united);
	write_short(0x0000);
	write_byte(0);
	write_byte(0);
	write_byte(0);
	write_byte(255);
	message_end();
}
ActionShejk(id, ent)
{
	static property1[5];
	GetProperty(ent, 1, property1);
	new amplitude = clamp( ( str_to_num(property1) * ( 1 << 14 ) ), 0, 0xFFFF );
	GetProperty(ent, 2, property1);
	new czasik = clamp( ( str_to_num(property1) * ( 1 << 12 ) ), 0, 0xFFFF );
	message_begin( MSG_ONE_UNRELIABLE, get_user_msgid( "ScreenShake" ), _, id);
	write_short(amplitude);
	write_short(czasik);
	write_short(1<<12);
	message_end();
}
ActionImpreza(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_melanz_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nMelanz^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX,  g_melanz_next_use[id] - gametime);
		}
		return PLUGIN_HANDLED;
	}
	static property[5];
	entity_set_float(id, EV_FL_maxspeed, 330.0);
	entity_set_float(id, EV_FL_takedamage, DAMAGE_NO);
	g_speedmelanz[id] = 330.0;
	g_melanz[id] = true;
	emit_sound(id, CHAN_STATIC, g_sound_melanz, 1.0, ATTN_NORM, 0, PITCH_NORM);
	static Float:time_out;
	GetProperty(ent, 1, property);
	new ref = str_to_num(property);
	time_out = str_to_float(property);
	set_task(time_out, "TaskRemoveMelanz", TASK_MELANZ + id, g_blank, 0, g_a, 1);
 
	GetProperty(ent, 2, property);
 
	g_melanz_time_out[id] = gametime + time_out;
	g_melanz_next_use[id] = gametime + time_out + str_to_float(property);
	set_task(0.2,"odswiezogien",id,_,_,"a",ref*5);
	return PLUGIN_HANDLED;
}
public odswiezogien(ent)
{
	if(is_user_connected(ent) && is_user_alive(ent))
	{
		static Float:originf[3];
		pev(ent, pev_origin, originf);
		engfunc(EngFunc_MessageBegin, MSG_PVS, SVC_TEMPENTITY, originf, 0);
		write_byte(TE_SPRITE); // TE id
		engfunc(EngFunc_WriteCoord, originf[0]+random_float(-5.0, 5.0)); // x
		engfunc(EngFunc_WriteCoord, originf[1]+random_float(-5.0, 5.0)); // y
		engfunc(EngFunc_WriteCoord, originf[2]+random_float(-10.0, 10.0)); // z
		write_short(g_flameSpr); // sprite
		write_byte(random_num(5, 10)); // scale
		write_byte(200); // brightness
		message_end();
	}
}
ActionNoSlowDown(id)
{
	g_no_slow_down[id] = true;
 
	new task_id = TASK_NOSLOWDOWN + id;
	if ( task_exists(task_id) ) remove_task(task_id);
 
	set_task(0.1, "TaskSlowDown", task_id);
}
 
ActionDelayedBhop(ent)
{
	if ( task_exists(TASK_SOLIDNOT + ent)
	|| task_exists(TASK_SOLID + ent) ) return PLUGIN_HANDLED;
 
	static property1[5];
	GetProperty(ent, 1, property1);
 
	set_task(str_to_float(property1), "TaskSolidNot", TASK_SOLIDNOT + ent);
 
	return PLUGIN_HANDLED;
}
 
ActionInvincibility(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_invincibility_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nNiesmiertelnosc^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX,  g_invincibility_next_use[id] - gametime);
		}
 
		return PLUGIN_HANDLED;
	}
 
	static property[5];
 
	entity_set_float(id, EV_FL_takedamage, DAMAGE_NO);
 
	if ( gametime >= g_stealth_time_out[id] )
	{
		set_user_rendering(id, kRenderFxGlowShell, 255, 255, 255, kRenderNormal, 16);
	}
 
	emit_sound(id, CHAN_STATIC, g_sound_invincibility, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	static Float:time_out;
	GetProperty(ent, 1, property);
	time_out = str_to_float(property);
	set_task(time_out, "TaskRemoveInvincibility", TASK_INVINCIBLE + id, g_blank, 0, g_a, 1);
 
	GetProperty(ent, 2, property);
 
	g_invincibility_time_out[id] = gametime + time_out;
	g_invincibility_next_use[id] = gametime + time_out + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
ActionCamouflage(id,ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_kamuflaz_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nKamuflaz^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX, g_kamuflaz_next_use[id] - gametime);
		}
 
		return PLUGIN_HANDLED;
	}
 
	static property[5];
 
 
	emit_sound(id, CHAN_STATIC, g_sound_camouflage, 1.0, ATTN_NORM, 0, PITCH_NORM);
	new szModel[32];
	new team;
	cs_get_user_model(id, szModel, 32);
	team = get_user_team(id);
	gszCamouflageOldModel[id] = szModel;
	if (team == 1)		//TERRORIST
	{
		cs_set_user_model(id, "urban");
	}
	else
	{
		cs_set_user_model(id, "leet");
	}
	static Float:time_out;
	GetProperty(ent, 1, property);
	time_out = str_to_float(property);
	set_task(time_out, "taskCamouflageRemove", TASK_KAMUFLAZ + id, g_blank, 0, g_a, 1);
 
	GetProperty(ent, 2, property);
 
	g_kamuflaz_time_out[id] = gametime + time_out;
	g_kamuflaz_next_use[id] = gametime + time_out + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
ActionStealth(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_stealth_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nNiewidzialnosc^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX, g_stealth_next_use[id] - gametime);
		}
 
		return PLUGIN_HANDLED;
	}
 
	static property[5];
 
	set_user_rendering(id, kRenderFxGlowShell, 0, 0, 0, kRenderTransColor, 0);
 
	emit_sound(id, CHAN_STATIC, g_sound_stealth, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	g_block_status[id] = true;
 
	static Float:time_out;
	GetProperty(ent, 1, property);
	time_out = str_to_float(property);
	set_task(time_out, "TaskRemoveStealth", TASK_STEALTH + id, g_blank, 0, g_a, 1);
 
	GetProperty(ent, 2, property);
 
	g_stealth_time_out[id] = gametime + time_out;
	g_stealth_next_use[id] = gametime + time_out + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
 
ActionBootsOfSpeed(id, ent)
{
	new Float:gametime = get_gametime();
	if ( !( gametime >= g_boots_of_speed_next_use[id] ) )
	{
		if ( !g_has_hud_text[id] )
		{
			set_hudmessage(0, 255, 0, 0.01, 0.18, 0, 0.0, 1.0, 0.25, 0.25, 2);
			show_hudmessage(id, "%s^nButy Szybkosci^nMozesz Uzyc Za: %.1f sekund", PLUGIN_PREFIX, g_boots_of_speed_next_use[id] - gametime);
		}
 
		return PLUGIN_HANDLED;
	}
 
	static property[5];
 
	GetProperty(ent, 3, property);
	entity_set_float(id, EV_FL_maxspeed, str_to_float(property));
 
	g_boots_of_speed[id] = ent;
 
	emit_sound(id, CHAN_STATIC, g_sound_boots_of_speed, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	static Float:time_out;
	GetProperty(ent, 1, property);
	time_out = str_to_float(property);
	set_task(time_out, "TaskRemoveBootsOfSpeed", TASK_BOOTSOFSPEED + id, g_blank, 0, g_a, 1);
 
	GetProperty(ent, 2, property);
 
	g_boots_of_speed_time_out[id] = gametime + time_out;
	g_boots_of_speed_next_use[id] = gametime + time_out + str_to_float(property);
 
	return PLUGIN_HANDLED;
}
ActionTeleport(id, ent)
{
	new tele = entity_get_int(ent, EV_INT_iuser1);
	if ( !tele ) return PLUGIN_HANDLED;
 
	static Float:tele_origin[3];
	entity_get_vector(tele, EV_VEC_origin, tele_origin);
 
	new player = -1;
	do
	{
		player = find_ent_in_sphere(player, tele_origin, 16.0);
 
		if ( !is_user_alive(player)
		|| player == id
		|| cs_get_user_team(id) == cs_get_user_team(player) ) continue;
 
		user_kill(player, 1);
	}
	while ( player );
 
	entity_set_vector(id, EV_VEC_origin, tele_origin);
	emit_sound(id, CHAN_STATIC, g_sound_TeleportSound, 1.0, ATTN_NORM, 0, PITCH_NORM);
 
	static Float:velocity[3];
	entity_get_vector(id, EV_VEC_velocity, velocity);
	velocity[2] = floatabs(velocity[2]);
	entity_set_vector(id, EV_VEC_velocity, velocity);
 
	return PLUGIN_HANDLED;
}
 
public TaskSolidNot(ent)
{
	ent -= TASK_SOLIDNOT;
	if( pev_valid( ent ) ) 
	{
		new Float:flRenderColor[ 3 ], Float:flRenderAmt, iRenderFX, iRenderMode;
		iRenderFX	= pev( ent, pev_renderfx );
		iRenderMode	= pev( ent, pev_rendermode );
		pev( ent, pev_rendercolor, flRenderColor );
		pev( ent, pev_renderamt, flRenderAmt );
 
		set_pev( ent, pev_speed, flRenderAmt );
		set_pev( ent, pev_oldorigin, flRenderColor );
		set_pev( ent, pev_euser1, iRenderFX );
		set_pev( ent, pev_euser2, iRenderMode );
 
		if ( !is_valid_ent(ent)
		|| entity_get_int(ent, EV_INT_iuser2) ) return PLUGIN_HANDLED;
 
		entity_set_int(ent, EV_INT_solid, SOLID_NOT);
		set_rendering(ent, kRenderFxNone, 255, 255, 255, kRenderTransAdd, 25);
		set_task(1.0, "TaskSolid", TASK_SOLID + ent);
 
		return PLUGIN_HANDLED;
	}
	return PLUGIN_CONTINUE;
}
 
public TaskSolid(ent)
{
	ent -= TASK_SOLID;
 
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
	new Float:flRenderColor[ 3 ], Float:flRenderAmt, iRenderFX, iRenderMode;
	iRenderFX	= pev( ent, pev_euser1 );
	iRenderMode	= pev( ent, pev_euser2 );
	pev( ent, pev_oldorigin, flRenderColor );
	pev( ent, pev_speed, flRenderAmt );
 
	set_pev( ent, pev_speed, 0.0 );
	set_pev( ent, pev_oldorigin, { 0.0, 0.0, 0.0 } );
	set_pev( ent, pev_euser1, 0 );
	set_pev( ent, pev_euser2, 0 );
 
	set_pev( ent, pev_renderamt, flRenderAmt );
	set_pev( ent, pev_rendercolor, flRenderColor );
	set_pev( ent, pev_renderfx, iRenderFX );
	set_pev( ent, pev_rendermode , iRenderMode );
 
	if ( entity_get_int(ent, EV_INT_iuser1) > 0 )
	{
		GroupBlock(0, ent);
	}
 
	return PLUGIN_HANDLED;
}
 
public TaskNotOnIce(id)
{
	id -= TASK_ICE;
 
	g_ice[id] = false;
 
	if ( !g_alive[id] ) return PLUGIN_HANDLED;
 
	if ( g_boots_of_speed[id] )
	{
		static block, property3[5];
		block = g_boots_of_speed[id];
		GetProperty(block, 3, property3);
 
		entity_set_float(id, EV_FL_maxspeed, str_to_float(property3));
	}
	else
	{
		ResetMaxspeed(id);
	}
 
	entity_set_float(id, EV_FL_friction, 1.0);
 
	return PLUGIN_HANDLED;
}
 
public TaskNotInHoney(id)
{
	id -= TASK_HONEY;
 
	g_honey[id] = 0;
 
	if ( !g_alive[id] ) return PLUGIN_HANDLED;
 
	if ( g_boots_of_speed[id] )
	{
		static block, property3[5];
		block = g_boots_of_speed[id];
		GetProperty(block, 3, property3);
 
		entity_set_float(id, EV_FL_maxspeed, str_to_float(property3));
	}
	else
	{
		ResetMaxspeed(id);
	}
 
	return PLUGIN_HANDLED;
}
 
public TaskSlowDown(id)
{
	id -= TASK_NOSLOWDOWN;
 
	g_no_slow_down[id] = false;
}
 
public TaskRemoveInvincibility(id)
{
	id -= TASK_INVINCIBLE;
 
	if (!g_alive[id]) return PLUGIN_HANDLED;
 
	if ((g_admin[id] || g_gived_access[id]) && !g_godmode[id]
	|| (!g_admin[id] && !g_gived_access[id]) && !g_all_godmode)
	{
		entity_set_float(id, EV_FL_takedamage, DAMAGE_YES);
	}
 
	if (get_gametime() >= g_stealth_time_out[id])
	{
		set_user_rendering(id, kRenderFxGlowShell, 0, 0, 0, kRenderNormal, 16);
	}
 
	return PLUGIN_HANDLED;
}
 
public TaskRemoveStealth(id)
{
	id -= TASK_STEALTH;
 
	if ( g_connected[id] )
	{
		if ( get_gametime() <= g_invincibility_time_out[id] )
		{
			set_user_rendering(id, kRenderFxGlowShell, 255, 255, 255, kRenderTransColor, 16);
		}
		else
		{
			set_user_rendering(id, kRenderFxGlowShell, 0, 0, 0, kRenderNormal, 255);
		}
	}
 
	g_block_status[id] = false;
}
public TaskRemoveMelanz(id)
{
	id -= TASK_MELANZ;
	g_melanz[id] = false;
	g_speedmelanz[id] = 0.0;
	if ( !g_alive[id] ) return PLUGIN_HANDLED;
 
	ResetMaxspeed(id);
	if ( ( g_admin[id] || g_gived_access[id] ) && !g_godmode[id]
	|| ( !g_admin[id] && !g_gived_access[id] ) && !g_all_godmode )
	{
		set_user_godmode(id, 0);
	}
	if ( get_gametime() >= g_stealth_time_out[id] )
	{
		set_user_rendering(id, kRenderFxGlowShell, 0, 0, 0, kRenderNormal, 16);
	}
	return PLUGIN_HANDLED;
}
public TaskRemoveBootsOfSpeed(id)
{
	id -= TASK_BOOTSOFSPEED;
 
	g_boots_of_speed[id] = 0;
 
	if ( !g_alive[id] ) return PLUGIN_HANDLED;
 
	if ( g_ice[id] )
	{
		entity_set_float(id, EV_FL_maxspeed, 400.0);
	}
	else if ( g_honey[id] )
	{
		static block, property1[5];
		block = g_honey[id];
		GetProperty(block, 1, property1);
 
		entity_set_float(id, EV_FL_maxspeed, str_to_float(property1));
	}
	else
	{
		ResetMaxspeed(id);
	}
 
	return PLUGIN_HANDLED;
}
 
public TaskSpriteNextFrame(params[])
{
	new ent = params[0];
	if ( !is_valid_ent(ent) )
	{
		remove_task(TASK_SPRITE + ent);
		return PLUGIN_HANDLED;
	}
 
	new frames = params[1];
	new Float:current_frame = entity_get_float(ent, EV_FL_frame);
 
	if ( current_frame < 0.0
	|| current_frame >= frames )
	{
		entity_set_float(ent, EV_FL_frame, 1.0);
	}
	else
	{
		entity_set_float(ent, EV_FL_frame, current_frame + 1.0);
	}
 
	return PLUGIN_HANDLED;
}
 
public MsgStatusValue()
{
	if ( get_msg_arg_int(1) == 2
	&& g_block_status[get_msg_arg_int(2)] )
	{
		set_msg_arg_int(1, get_msg_argtype(1), 1);
		set_msg_arg_int(2, get_msg_argtype(2), 0);
	}
}
 
public CmdAttack(id)
{
	if ( !IsBlock(g_grabbed[id]) ) return PLUGIN_HANDLED;
 
	if ( IsBlockInGroup(id, g_grabbed[id]) && g_group_count[id] > 1 )
	{
		static block;
		for ( new i = 0; i <= g_group_count[id]; ++i )
		{
			block = g_grouped_blocks[id][i];
			if ( !IsBlockInGroup(id, block) ) continue;
 
			if ( !IsBlockStuck(block) )
			{
				CopyBlock(block);
			}
		}
	}
	else
	{
		if ( IsBlockStuck(g_grabbed[id]) )
		{
			BCM_Print(id, "You cannot copy a block that is in a stuck position!");
			return PLUGIN_HANDLED;
		}
 
		new new_block = CopyBlock(g_grabbed[id]);
		if ( !new_block ) return PLUGIN_HANDLED;
 
		entity_set_int(g_grabbed[id], EV_INT_iuser2, 0);
		entity_set_int(new_block, EV_INT_iuser2, id);
		g_grabbed[id] = new_block;
	}
 
	return PLUGIN_HANDLED;
}
 
public CmdAttack2(id)
{
	if ( !IsBlock(g_grabbed[id]) )
	{
		DeleteTeleport(id, g_grabbed[id]);
		return PLUGIN_HANDLED;
	}
 
	if ( !IsBlockInGroup(id, g_grabbed[id])
	|| g_group_count[id] < 2 )
	{
		DeleteBlock(g_grabbed[id]);
		return PLUGIN_HANDLED;
	}
 
	static block;
	for ( new i = 0; i <= g_group_count[id]; ++i )
	{
		block = g_grouped_blocks[id][i];
		if ( !is_valid_ent(block)
		|| !IsBlockInGroup(id, block) ) continue;
 
		DeleteBlock(block);
	}
 
	return PLUGIN_HANDLED;
}
 
public CmdRotate(id)
{		
	if ( !IsBlock(g_grabbed[id]) ) return PLUGIN_HANDLED;
 
	if ( !IsBlockInGroup(id, g_grabbed[id])
	|| g_group_count[id] < 2 )
	{
		RotateBlock(g_grabbed[id]);
		return PLUGIN_HANDLED;
	}
 
	static block;
	for ( new i = 0; i <= g_group_count[id]; ++i )
	{
		block = g_grouped_blocks[id][i];
		if ( !is_valid_ent(block)
		|| !IsBlockInGroup(id, block) ) continue;
 
		RotateBlock(block);
	}
 
	return PLUGIN_HANDLED;
}
 
public CmdGrab(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	g_grab_length[id] = get_user_aiming(id, ent, body);
 
	new bool:is_block = IsBlock(ent);
 
	if ( !is_block && !IsTeleport(ent) && !IsLight(ent) ) return PLUGIN_HANDLED;
 
	new grabber = entity_get_int(ent, EV_INT_iuser2);
	if ( grabber && grabber != id ) return PLUGIN_HANDLED;
 
	if ( !is_block )
	{
		SetGrabbed(id, ent);
		return PLUGIN_HANDLED;
	}
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( player && player != id )
	{
		new player_name[32]; 
		get_user_name(player, player_name, charsmax(player_name));
 
		BCM_Print(id, "^1%s3 currently has this block in their group!", player_name);
		return PLUGIN_HANDLED;
	}
 
	SetGrabbed(id, ent);
 
	if ( g_group_count[id] < 2 ) return PLUGIN_HANDLED;
 
	static Float:grabbed_origin[3];
 
	entity_get_vector(ent, EV_VEC_origin, grabbed_origin);
 
	static block, Float:origin[3], Float:offset[3];
	for ( new i = 0; i <= g_group_count[id]; ++i )
	{
		block = g_grouped_blocks[id][i];
		if ( !is_valid_ent(block) ) continue;
 
		entity_get_vector(block, EV_VEC_origin, origin);
 
		offset[0] = grabbed_origin[0] - origin[0];
		offset[1] = grabbed_origin[1] - origin[1];
		offset[2] = grabbed_origin[2] - origin[2];
 
		entity_set_vector(block, EV_VEC_vuser1, offset);
		entity_set_int(block, EV_INT_iuser2, id);
	}
 
	return PLUGIN_HANDLED;
}
 
SetGrabbed(id, ent)
{
	entity_get_string(id, EV_SZ_viewmodel, g_viewmodel[id], charsmax(g_viewmodel));
	entity_set_string(id, EV_SZ_viewmodel, g_blank);
 
	static aiming[3], Float:origin[3];
 
	get_user_origin(id, aiming, 3);
	entity_get_vector(ent, EV_VEC_origin, origin);
 
	g_grabbed[id] = ent;
	g_grab_offset[id][0] = origin[0] - aiming[0];
	g_grab_offset[id][1] = origin[1] - aiming[1];
	g_grab_offset[id][2] = origin[2] - aiming[2];
 
	entity_set_int(ent, EV_INT_iuser2, id);
}
 
public CmdRelease(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
	else if ( !g_grabbed[id] )
	{
		return PLUGIN_HANDLED;
	}
 
	if ( IsBlock(g_grabbed[id]) )
	{
		if ( IsBlockInGroup(id, g_grabbed[id]) && g_group_count[id] > 1 )
		{
			static i, block;
 
			new bool:group_is_stuck = true;
 
			for ( i = 0; i <= g_group_count[id]; ++i )
			{
				block = g_grouped_blocks[id][i];
				if ( IsBlockInGroup(id, block) )
				{
					entity_set_int(block, EV_INT_iuser2, 0);
 
					if ( group_is_stuck && !IsBlockStuck(block) )
					{
						group_is_stuck = false;
						break;
					}
				}
			}
 
			if ( group_is_stuck )
			{
				for ( i = 0; i <= g_group_count[id]; ++i )
				{
					block = g_grouped_blocks[id][i];
					if ( IsBlockInGroup(id, block) ) DeleteBlock(block);
				}
 
				BCM_Print(id, "Group deleted because all the blocks were stuck!");
			}
		}
		else
		{
			if ( is_valid_ent(g_grabbed[id]) )
			{
				if ( IsBlockStuck(g_grabbed[id]) )
				{
					new bool:deleted = DeleteBlock(g_grabbed[id]);
					if ( deleted ) BCM_Print(id, "Kurwa block Ci utknal!");
				}
				else
				{
					entity_set_int(g_grabbed[id], EV_INT_iuser2, 0);
				}
			}
		}
	}
	else if ( IsTeleport(g_grabbed[id]) )
	{
		entity_set_int(g_grabbed[id], EV_INT_iuser2, 0);
	}
 
	entity_get_string(id, EV_SZ_viewmodel, g_viewmodel[id], charsmax(g_viewmodel));
	entity_set_string(id, EV_SZ_viewmodel, g_blank);
 
	g_grabbed[id] = 0;
 
	return PLUGIN_HANDLED;
}
 
public CmdMainMenu(id)
{
	if(g_admin[id] || g_gived_access[id])
	{
		ShowMainMenu(id);
		return PLUGIN_HANDLED;
	}
	else
	{
		CmdShowInfo(id);
		return PLUGIN_HANDLED;
	}
	return PLUGIN_CONTINUE;
}
//RENDERING
ShowRenderMenu(id)
{	
	new szMenu[256];
	new szSize[12];
 
	switch (gTyp[id])
	{
		case 1: szSize = "GLOWSHELL";
		case 2: szSize = "TRANSCOLOR";
		case 3: szSize = "TRANSALPHA"; 
		case 4: szSize = "TRANSWHITE";
		case 5: szSize = "GLOW&ALPHA";
		case 6: szSize = "HOLOGRAM";
		case 7: szSize = "FADEFAST";
	}
 
	format(szMenu, sizeof(szMenu), gRenderMenu, szSize,Przezroczystosc[id], Czerwony[id], Zielony[id], Niebieski[id]);
 
	show_menu(id, gRenderMenuKeys, szMenu, -1, "bmRenderMenu");
}
public HandleRenderMenu(id, num)
{
 
	switch ( num )
	{
		case K1:
		{
			MenuRenderingBlock(id);
		}
		case K2: toggleType(id);
		case K3: 
		{
			gRenderInfo[id] = 1;
			client_cmd(id,"messagemode BCM_SetRendering");
		}
		case K4:
		{
			gRenderInfo[id] = 2;
			client_cmd(id,"messagemode BCM_SetRendering");
		}
		case K5:
		{
			gRenderInfo[id] = 3;
			client_cmd(id,"messagemode BCM_SetRendering");
		}
		case K6:
		{
			gRenderInfo[id] = 4;
			client_cmd(id,"messagemode BCM_SetRendering");
		}
		case K0: ShowMainMenu(id);
	}
	ShowRenderMenu(id);
	if (num == K0)
		ShowMainMenu(id);
 
	return PLUGIN_HANDLED;
}
public MenuRenderingBlock(id)
{
 
	new ent, body;
	get_user_aiming(id, ent, body);
	if (IsBlock(ent))
	{
		SetBlockRendering(ent, gTyp[id], Czerwony[id], Zielony[id], Niebieski[id], Przezroczystosc[id]);
	}
}
stock fm_set_rendering(entity, fx = kRenderFxNone, r = 255, g = 255, b = 255, render = kRenderNormal, amount = 16) 
{
	new Float:RenderColor[3];
	RenderColor[0] = float(r);
	RenderColor[1] = float(g);
	RenderColor[2] = float(b);
 
	set_pev(entity, pev_renderfx, fx);
	set_pev(entity, pev_rendercolor, RenderColor);
	set_pev(entity, pev_rendermode, render);
	set_pev(entity, pev_renderamt, float(amount));
 
	return 1;
}
toggleType(id)
{
	if (gTyp[id] == GLOWSHELL)
	{
		gTyp[id] = TRANSCOLOR;
		return PLUGIN_HANDLED;
	}	
	else if(gTyp[id] == TRANSCOLOR)
	{
		gTyp[id] = TRANSALPHA;
		return PLUGIN_HANDLED;
	}
	else if(gTyp[id] == TRANSALPHA)
	{
		gTyp[id] = TRANSWHITE;
		return PLUGIN_HANDLED;
	}
	else if(gTyp[id] == TRANSWHITE)
	{
		gTyp[id] = GLOWALPHA;
		return PLUGIN_HANDLED;
	}
	else if(gTyp[id] == GLOWALPHA)
	{
		gTyp[id] = HOLOGRAM;
		return PLUGIN_HANDLED;
	}
	else if(gTyp[id] == HOLOGRAM)
	{
		gTyp[id] = FADEFAST;
		return PLUGIN_HANDLED;
	}
	else if(gTyp[id] == FADEFAST)
	{
		gTyp[id] = GLOWSHELL;
		return PLUGIN_HANDLED;
	}
 
	return PLUGIN_CONTINUE;
}
// RENDER
ShowMainMenu(id)
{
	new menu[256], col1[3], col2[3];
 
	col1 = g_admin[id] || g_gived_access[id] ? "\r" : "\d";
	col2 = g_admin[id] || g_gived_access[id] ? "\w" : "\d";
 
	format(menu, charsmax(menu),\
	g_main_menu,\
	PLUGIN_PREFIX,\
	PLUGIN_NAME,\
	PLUGIN_VERSION,\
	col1,\
	col2,\
	g_noclip[id] ? "\yTak" : "\rNie",\
	col1,\
	col2,\
	g_godmode[id] ? "\yTak" : "\rNie",\
	col1,\
	col2
	);
 
	show_menu(id, g_keys_main_menu, menu, -1, "BcmMainMenu");
}
ShowWeaponsMenu(id)
{
	new menu[256];
	if(g_weapons_page[id] == 1)
	{
		format(menu, charsmax(menu),\
		g_weapons_menu,\
		PLUGIN_PREFIX,\
		PLUGIN_NAME,\
		PLUGIN_VERSION
		);
 
		show_menu(id, g_keys_weapons_menu, menu, -1, "BcmWeaponsMenu");
	}
	else if(g_weapons_page[id] == 2)
	{
		format(menu, charsmax(menu),\
		g_weapons_menu2,\
		PLUGIN_PREFIX,\
		PLUGIN_NAME,\
		PLUGIN_VERSION
		);
 
		show_menu(id, g_keys_weapons_menu2, menu, -1, "BcmWeaponsMenu");
	}
	else if(g_weapons_page[id] == 3)
	{
		format(menu, charsmax(menu),\
		g_weapons_menu3,\
		PLUGIN_PREFIX,\
		PLUGIN_NAME,\
		PLUGIN_VERSION
		);
 
		show_menu(id, g_keys_weapons_menu3, menu, -1, "BcmWeaponsMenu");
	}
	else if(g_weapons_page[id] == 4)
	{
		format(menu, charsmax(menu),\
		g_weapons_menu4,\
		PLUGIN_PREFIX,\
		PLUGIN_NAME,\
		PLUGIN_VERSION
		);
 
		show_menu(id, g_keys_weapons_menu4, menu, -1, "BcmWeaponsMenu");
	}
}
/*ShowWeaponsMenu2(id)
{
new menu[256];
 
format(menu, charsmax(menu),\
g_weapons_menu2,\
PLUGIN_PREFIX,\
PLUGIN_NAME,\
PLUGIN_VERSION
);
 
show_menu(id, g_keys_weapons_menu2, menu, -1, "BcmWeaponsMenu2");
}
ShowWeaponsMenu3(id)
{
new menu[256];
 
format(menu, charsmax(menu),\
g_weapons_menu3,\
PLUGIN_PREFIX,\
PLUGIN_NAME,\
PLUGIN_VERSION
);
 
show_menu(id, g_keys_weapons_menu3, menu, -1, "BcmWeaponsMenu3");
}*/
ShowBlockMenu(id)
{
	new menu[256], col1[3], col2[3], size[8];
 
	col1 = g_admin[id] || g_gived_access[id] ? "\r" : "\d";
	col2 = g_admin[id] || g_gived_access[id] ? "\w" : "\d";
 
	switch ( g_selected_block_size[id] )
	{
		case TINY:	size = "Tiny";
		case NORMAL:	size = "Normal";
		case LARGE:	size = "Large";
		case POLE:	size = "Pole";
	}
 
	format(menu, charsmax(menu),\
	g_block_menu,\
	PLUGIN_PREFIX,\
	g_block_names[g_selected_block_type[id]],\
	size,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2
	);
 
	show_menu(id, g_keys_block_menu, menu, -1, "BcmBlockMenu");
}
 
ShowBlockSelectionMenu(id)
{
	new menu[256], title[32], entry[32], num;
 
	format(title, charsmax(title), "\r[%s] \yBlocki: %d^n^n", PLUGIN_PREFIX, g_block_selection_page[id]);
	add(menu, charsmax(menu), title);
 
	new start_block = ( g_block_selection_page[id] - 1 ) * 8;
 
	for ( new i = start_block; i < start_block + 8; ++i )
	{
		if ( i < TOTAL_BLOCKS )
		{
			num = ( i - start_block ) + 1;
 
			format(entry, charsmax(entry), "\r%d. \w%s^n", num, g_block_names[i]);
		}
		else
		{
			format(entry, charsmax(entry), "^n");
		}
 
		add(menu, charsmax(menu), entry);
	}
 
	if ( g_block_selection_page[id] < g_block_selection_pages_max )
	{
		add(menu, charsmax(menu), "^n\r9. \wDalej");
	}
	else
	{
		add(menu, charsmax(menu), "^n");
	}
 
	add(menu, charsmax(menu), "^n\r0. \wCofnij");
 
	show_menu(id, g_keys_block_selection_menu, menu, -1, "BcmBlockSelectionMenu");
}
 
ShowPropertiesMenu(id, ent)
{
	new menu[256], title[32], entry[64], property[13], line1[3], line2[3], line3[3], line4[3], num, block_type;
 
	block_type = entity_get_int(ent, EV_INT_body);
 
	format(title, charsmax(title), "\r[%s] \ySet Properties^n^n", PLUGIN_PREFIX);
	add(menu, charsmax(menu), title);
 
	if ( g_property1_name[block_type][0] )
	{
		GetProperty(ent, 1, property);
 
		if ( block_type == BUNNYHOP
		|| block_type == NO_SLOW_DOWN_BUNNYHOP
		|| block_type == DEATH)
		{
			format(entry, charsmax(entry), "\r1. \w%s: %s^n", g_property1_name[block_type], property[0] == '1' ? "\yTak" : "\rNie");
		}
		else if(block_type == BRON)
		{
			g_property_info[id][1] = ent;
			format(entry, charsmax(entry), "\r1. \w%s: \y%s^n", g_property1_name[block_type], property[0]);
		}
		else
		{
			format(entry, charsmax(entry), "\r1. \w%s: \y%s^n", g_property1_name[block_type], property);
		}
 
		add(menu, charsmax(menu), entry);
	}
	else
	{
		format(line1, charsmax(line1), "^n");
	}
 
	if ( g_property2_name[block_type][0] )
	{
		if ( g_property1_name[block_type][0] )
		{
			num = 2;
		}
		else
		{
			num = 1;
		}
 
		GetProperty(ent, 2, property);
 
		format(entry, charsmax(entry), "\r%d. \w%s: \y%s^n", num, g_property2_name[block_type], property);
 
		add(menu, charsmax(menu), entry);
	}
	else
	{
		format(line2, charsmax(line2), "^n");
	}
 
	if ( g_property3_name[block_type][0] )
	{
		if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] )
		{
			num = 3;
		}
		else if ( g_property1_name[block_type][0]
		|| g_property2_name[block_type][0] )
		{
			num = 2;
		}
		else
		{
			num = 1;
		}
 
		GetProperty(ent, 3, property);
 
		if ( block_type == BOOTS_OF_SPEED
		|| property[0] != '0' && !( property[0] == '2' && property[1] == '5' && property[2] == '5' ) )
		{
			format(entry, charsmax(entry), "\r%d. \w%s: \y%s^n", num, g_property3_name[block_type], property);
		}
		else
		{
			format(entry, charsmax(entry), "\r%d. \w%s: \rOff^n", num, g_property3_name[block_type]);
		}
 
		add(menu, charsmax(menu), entry);
	}
	else
	{
		format(line3, charsmax(line3), "^n");
	}
 
	if ( g_property4_name[block_type][0] )
	{
		if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] && g_property3_name[block_type][0] )
		{
			num = 4;
		}
		else if ( g_property1_name[block_type][0] && g_property2_name[block_type][0]
		|| g_property1_name[block_type][0] && g_property3_name[block_type][0]
		|| g_property2_name[block_type][0] && g_property3_name[block_type][0] )
		{
			num = 3;
		}
		else if ( g_property1_name[block_type][0]
		|| g_property2_name[block_type][0]
		|| g_property3_name[block_type][0] )
		{
			num = 2;
		}
		else
		{
			num = 1;
		}
 
		GetProperty(ent, 4, property);
 
		format(entry, charsmax(entry), "\r%d. \w%s: %s^n", num, g_property4_name[block_type], property[0] == '1' ? "\yTak" : "\rNie");
		add(menu, charsmax(menu), entry);
	}
	else
	{
		format(line4, charsmax(line4), "^n");
	}
 
	g_property_info[id][1] = ent;
 
	add(menu, charsmax(menu), line1);
	add(menu, charsmax(menu), line2);
	add(menu, charsmax(menu), line3);
	add(menu, charsmax(menu), line4);
	add(menu, charsmax(menu), "^n^n^n^n^n^n\r0. \wBack");
 
	show_menu(id, g_keys_properties_menu, menu, -1, "BcmPropertiesMenu");
}
 
ShowMoveMenu(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	new menu[256];
 
	format(menu, charsmax(menu), g_move_menu, PLUGIN_PREFIX, g_grid_size[id]);
 
	show_menu(id, g_keys_move_menu, menu, -1, "BcmMoveMenu");
 
	return PLUGIN_HANDLED;
}
 
ShowTeleportMenu(id)
{
	new menu[256], col1[3], col2[3];
 
	col1 = g_admin[id] || g_gived_access[id] ? "\r" : "\d";
	col2 = g_admin[id] || g_gived_access[id] ? "\w" : "\d";
 
	format(menu, charsmax(menu),\
	g_teleport_menu,\
	PLUGIN_PREFIX,\
	col1,\
	col2,\
	g_teleport_start[id] ? "\r" : "\d",\
	g_teleport_start[id] ? "\w" : "\d",\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2
	);
 
	show_menu(id, g_keys_teleport_menu, menu, -1, "BcmTeleportMenu");
}
 
ShowLightMenu(id)
{
	new menu[256], col1[3], col2[3];
 
	col1 = g_admin[id] || g_gived_access[id] ? "\r" : "\d";
	col2 = g_admin[id] || g_gived_access[id] ? "\w" : "\d";
 
	format(menu, charsmax(menu),\
	g_light_menu,\
	PLUGIN_PREFIX,\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2
	);
 
	show_menu(id, g_keys_light_menu, menu, -1, "BcmLightMenu");
}
 
ShowLightPropertiesMenu(id, ent)
{
	new menu[256], radius[5], color_red[5], color_green[5], color_blue[5];
 
	GetProperty(ent, 1, radius);
	GetProperty(ent, 2, color_red);
	GetProperty(ent, 3, color_green);
	GetProperty(ent, 4, color_blue);
 
	format(menu, charsmax(menu),\
	g_light_properties_menu,\
	PLUGIN_PREFIX,\
	radius,\
	color_red,\
	color_green,\
	color_blue
	);
 
	g_light_property_info[id][1] = ent;
 
	show_menu(id, g_keys_light_properties_menu, menu, -1, "BcmLightPropertiesMenu");
}
 
ShowOptionsMenu(id)
{
	new menu[256], col1[3], col2[3], col3[3], col4[3];
 
	col1 = g_admin[id] || g_gived_access[id] ? "\r" : "\d";
	col2 = g_admin[id] || g_gived_access[id] ? "\w" : "\d";
	col3 = g_admin[id] ? "\r" : "\d";
	col4 = g_admin[id] ? "\w" : "\d";
 
	format(menu, charsmax(menu),\
	g_options_menu,\
	PLUGIN_PREFIX,\
	col1,\
	col2,\
	g_snapping[id] ? "\yTak" : "\rNie",\
	col1,\
	col2,\
	g_snapping_gap[id],\
	col1,\
	col2,\
	col1,\
	col2,\
	col3,\
	col4,\
	col3,\
	col4,\
	col3,\
	col4
	);
 
	show_menu(id, g_keys_options_menu, menu, -1, "BcmOptionsMenu");
}
 
ShowChoiceMenu(id, choice, const title[96])
{
	new menu[128];
 
	g_choice_option[id] = choice;
 
	format(menu, charsmax(menu), g_choice_menu, title);
 
	show_menu(id, g_keys_choice_menu, menu, -1, "BcmChoiceMenu");
}
 
ShowCommandsMenu(id)
{
	new menu[256], col1[3], col2[3], col3[3], col4[3];
 
	col1 = g_admin[id] ? "\r" : "\d";
	col2 = g_admin[id] ? "\w" : "\d";
	col3 = ( g_admin[id] || g_gived_access[id] ) && g_alive[id] ? "\r" : "\d";
	col4 = ( g_admin[id] || g_gived_access[id] ) && g_alive[id] ? "\w" : "\d";
 
	format(menu, charsmax(menu),\
	g_commands_menu,\
	PLUGIN_PREFIX,\
	col3,\
	col4,\
	g_alive[id] && g_has_checkpoint[id] ? "\r" : "\d",\
	g_alive[id] && g_has_checkpoint[id] ? "\w" : "\d",\
	( g_admin[id] || g_gived_access[id] ) && !g_alive[id] ? "\r" : "\d",\
	( g_admin[id] || g_gived_access[id] ) && !g_alive[id] ? "\w" : "\d",\
	col1,\
	col2,\
	col1,\
	col2,\
	col1,\
	col2,\
	g_all_godmode ? "Zabierz" : "Daj",\
	g_all_godmode ? "od" : "dla",\
	col1,\
	col2,\
	PLUGIN_PREFIX
	);
 
	show_menu(id, g_keys_commands_menu, menu, -1, "BcmCommandsMenu");
}
ShowFlyMenu(id)
{
	new szMenu[512];
	new szVelo[3][3];
 
	szVelo[0] = (fTempVelo[id][2] >= 25.0 ? "\w" : "\d");
	szVelo[1] = (fTempVelo[id][0] >= 25.0 ? "\w" : "\d");
	szVelo[2] = (fTempVelo[id][1] >= 25.0 ? "\w" : "\d");	
 
	format(szMenu, 512, gszFlyMenu, szVelo[0], floatround(fTempVelo[id][2]), szVelo[1], floatround(fTempVelo[id][0]), szVelo[2], floatround(fTempVelo[id][1]), g_iTempFlyDistance[id]);
 
	show_menu(id, gKeysFlyMenu, szMenu, -1, "bmFlyMenu");
}
 
 
public handleFlyMenu(id, key){
		/*
		2
		0
		1
		*/
 
	switch (key){
		case K1:{
			fTempVelo[id][0] = 0.0;
			fTempVelo[id][1] = 0.0;
			if(fTempVelo[id][2] >= 500) 	fTempVelo[id][2] = 0.0;
			else				fTempVelo[id][2] += 25.0;
		} 
		case K2:{
			fTempVelo[id][2] = 0.0;
			fTempVelo[id][1] = 0.0;
			if(fTempVelo[id][0] >= 500) 	fTempVelo[id][0] = 0.0;
			else				fTempVelo[id][0] += 25.0;
		} 
		case K3:{
			fTempVelo[id][2] = 0.0;
			fTempVelo[id][0] = 0.0;
			if(fTempVelo[id][1] >= 500) 	fTempVelo[id][1] = 0.0;
			else				fTempVelo[id][1] += 25.0;
		}
 
		case K4: { 
			if(g_iTempFlyDistance[id] >= 300) g_iTempFlyDistance[id] = 0;
			else g_iTempFlyDistance[id] += 25;
		}
		case K5: {
			new ent, body;
			get_user_aiming(id, ent, body);
			if(IsBlock(ent)){
				pev(ent, pev_origin, g_fOrigin[ent]);
				set_pev(ent, pev_movetype, MOVETYPE_FLY);
 
				fVelo[ent][0] = fTempVelo[id][0];
				fVelo[ent][1] = fTempVelo[id][1];
				fVelo[ent][2] = fTempVelo[id][2];
				g_iFlyDistance[ent] = g_iTempFlyDistance[id];
 
				set_pev(ent, pev_velocity, fVelo[ent]);
 
				set_pev(ent, pev_nextthink, get_gametime() + 0.02);
 
				client_print(id, 3, "Sukces!");
			}
			else{
				client_print(id, 3, "Musisz najechac na blok aby tego uzyc!");
			}
		}
		case K0: { ShowMainMenu(id); }
	}
 
	if (key != K0)
		ShowFlyMenu(id);
}
 
public HandleMainMenu(id, key)
{
	switch ( key )
	{
		case K1: ShowBlockMenu(id);
		case K2: ShowTeleportMenu(id);
		case K3: ShowLightMenu(id);
		case K4: ShowOptionsMenu(id);
		case K5:
		{
			g_viewing_commands_menu[id] = true;
			ShowCommandsMenu(id);
		}
		case K6: ToggleNoclip(id);
		case K7: ToggleGodmode(id);
		case K8: ShowRenderMenu(id);
		case K9: CmdShowInfo(id);
		case K0: return;
	}
 
	if ( key == K6 || key == K7 || key == K9 ) ShowMainMenu(id);
}
public HandleWeaponsMenu(id, key)
{
	new ent = g_property_info[id][1];
	if(g_weapons_page[id] == 1)
	{
		switch ( key )
		{
			case K1: SetProperty(ent, 1, "p228");
			case K2: SetProperty(ent, 1, "scout");
			case K3: SetProperty(ent, 1, "xm1014");
			case K4: SetProperty(ent, 1, "mac10");
			case K5: SetProperty(ent, 1, "aug");
			case K6: SetProperty(ent, 1, "elite");
			case K7: SetProperty(ent, 1, "fiveseven");
			case K8: SetProperty(ent, 1, "ump45");
			case K9: 
			{
				g_weapons_page[id] = 2;
				ShowWeaponsMenu(id);
			}	
			case K0: ShowMainMenu(id);
		}
	}
	else if(g_weapons_page[id] == 2)
	{
		switch ( key )
		{
			case K1: SetProperty(ent, 1, "sg550");
			case K2: SetProperty(ent, 1, "galil");
			case K3: SetProperty(ent, 1, "famas");
			case K4: SetProperty(ent, 1, "usp");
			case K5: SetProperty(ent, 1, "glock18");
			case K6: SetProperty(ent, 1, "awp");
			case K7: SetProperty(ent, 1, "mp5navy");
			case K8: SetProperty(ent, 1, "m249");
			case K9: 
			{
				g_weapons_page[id] = 3;
				ShowWeaponsMenu(id);
			}
			case K0:
			{
				g_weapons_page[id] = 1;
				ShowWeaponsMenu(id);
			}
		}
	}
	else if(g_weapons_page[id] == 3)
	{
		switch ( key )
		{
			case K1: SetProperty(ent, 1, "m3");
			case K2: SetProperty(ent, 1, "m4a1");
			case K3: SetProperty(ent, 1, "tmp");
			case K4: SetProperty(ent, 1, "g3sg1");
			case K5: SetProperty(ent, 1, "deagle");
			case K6: SetProperty(ent, 1, "sg552");
			case K7: SetProperty(ent, 1, "ak47");
			case K8:
			{
				g_weapons_page[id] = 2;
				ShowWeaponsMenu(id);
			}
			case K9: 
			{
				g_weapons_page[id] = 4;
				ShowWeaponsMenu(id);
			}	
			case K0: ShowMainMenu(id);
		}
	}
	else if(g_weapons_page[id] == 4)
	{
		switch ( key )
		{
			case K1: SetProperty(ent, 1, "hegrenade");
			case K2: SetProperty(ent, 1, "flashbang");
			case K3: SetProperty(ent, 1, "smokegrenade");
			case K4: SetProperty(ent, 1, "p90");
			case K9: 
			{
				g_weapons_page[id] = 3;
				ShowWeaponsMenu(id);
			}	
			case K0: ShowMainMenu(id);
		}
	}
 
}
public HandleBlockMenu(id, key)
{
	switch ( key )
	{
		case K1:
		{
			g_block_selection_page[id] = 1;
			ShowBlockSelectionMenu(id);
		}
		case K2: ChangeBlockSize(id);
		case K3: CreateBlockAiming(id, g_selected_block_type[id]);
		case K4: ConvertBlockAiming(id, g_selected_block_type[id]);
		case K5: DeleteBlockAiming(id);
		case K6: RotateBlockAiming(id);
		case K7: SetPropertiesBlockAiming(id);
		case K8: ShowMoveMenu(id);
		case K9: ShowFlyMenu(id);
		case K0: ShowMainMenu(id);
	}
 
	if ( key != K1 && key != K7 && key != K8 && key != K0 && key != K9 ) ShowBlockMenu(id);
}
public HandleBlockSelectionMenu(id, key)
{
	switch ( key )
	{
		case K9:
		{
			++g_block_selection_page[id];
 
			if ( g_block_selection_page[id] > g_block_selection_pages_max )
			{
				g_block_selection_page[id] = g_block_selection_pages_max;
			}
 
			ShowBlockSelectionMenu(id);
		}
		case K0:
		{
			--g_block_selection_page[id];
 
			if ( g_block_selection_page[id] < 1 )
			{
				ShowBlockMenu(id);
			}
			else
			{
				ShowBlockSelectionMenu(id);
			}
		}
		default:
		{
			key += ( g_block_selection_page[id] - 1 ) * 8;
 
			if ( key < TOTAL_BLOCKS )
			{
				g_selected_block_type[id] = key;
				ShowBlockMenu(id);
			}
			else
			{
				ShowBlockSelectionMenu(id);
			}
		}
	}
}
 
public HandlePropertiesMenu(id, key)
{
	new ent = g_property_info[id][1];
	if ( !is_valid_ent(ent) )
	{
		BCM_Print(id, "That block has been deleted!");
		g_viewing_properties_menu[id] = false;
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	new block_type = entity_get_int(ent, EV_INT_body);
 
	switch ( key )
	{
		case K1:
		{
			if ( g_property1_name[block_type][0] )
			{
				g_property_info[id][0] = 1;
			}
			else if ( g_property2_name[block_type][0] )
			{
				g_property_info[id][0] = 2;
			}
			else if ( g_property3_name[block_type][0] )
			{
				g_property_info[id][0] = 3;
			}
			else
			{
				g_property_info[id][0] = 4;
			}
 
			if ( g_property_info[id][0] == 1
			&& ( block_type == BUNNYHOP
			|| block_type == NO_SLOW_DOWN_BUNNYHOP
			|| block_type == DEATH ))
			{
				ToggleProperty(id, 1);
			}
			else if(g_property_info[id][0] == 1 && block_type == BRON)
			{
				ShowWeaponsMenu(id);
				return PLUGIN_CONTINUE;
			}
			else if ( g_property_info[id][0] == 4 )
			{
				ToggleProperty(id, 4);
			}
			else
			{
				BCM_Print(id, "Type the new property value for the block.%s", g_property_info[id][0] == 3 && block_type != BOOTS_OF_SPEED ? "^1 0^3 and^1 255^3 will turn transparency off." : g_blank);
				client_cmd(id, "messagemode BCM_SetProperty");
			}
		}
		case K2:
		{
			if ( g_property1_name[block_type][0] && g_property2_name[block_type][0]
			|| g_property1_name[block_type][0] && g_property3_name[block_type][0]
			|| g_property1_name[block_type][0] && g_property4_name[block_type][0]
			|| g_property2_name[block_type][0] && g_property3_name[block_type][0]
			|| g_property2_name[block_type][0] && g_property4_name[block_type][0]
			|| g_property3_name[block_type][0] && g_property4_name[block_type][0] )
			{
				if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] )
				{
					g_property_info[id][0] = 2;
				}
				else if ( g_property1_name[block_type][0] && g_property3_name[block_type][0]
				|| g_property2_name[block_type][0] && g_property3_name[block_type][0] )
				{
					g_property_info[id][0] = 3;
				}
				else
				{
					g_property_info[id][0] = 4;
				}
 
				if ( g_property_info[id][0] == 4 )
				{
					ToggleProperty(id, 4);
				}
				else
				{
					BCM_Print(id, "Type the new property value for the block.%s", g_property_info[id][0] == 3 && block_type != BOOTS_OF_SPEED ? "^1 0^3 and^1 255^3 will turn transparency off." : g_blank);
					client_cmd(id, "messagemode BCM_SetProperty");
				}
			}
		}
		case K3:
		{
			if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] && g_property3_name[block_type][0]
			|| g_property1_name[block_type][0] && g_property2_name[block_type][0] && g_property4_name[block_type][0]
			|| g_property1_name[block_type][0] && g_property3_name[block_type][0] && g_property4_name[block_type][0]
			|| g_property2_name[block_type][0] && g_property3_name[block_type][0] && g_property4_name[block_type][0] )
			{
				if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] && g_property3_name[block_type][0] )
				{
					g_property_info[id][0] = 3;
				}
				else
				{
					g_property_info[id][0] = 4;
				}
 
				if ( g_property_info[id][0] == 4 )
				{
					ToggleProperty(id, 4);
				}
				else
				{
					BCM_Print(id, "Type the new property value for the block.%s", g_property_info[id][0] == 3 && block_type != BOOTS_OF_SPEED ? "^1 0^3 and^1 255^3 will turn transparency off." : g_blank);
					client_cmd(id, "messagemode BCM_SetProperty");
				}
			}
		}
		case K4:
		{
			if ( g_property1_name[block_type][0] && g_property2_name[block_type][0] && g_property3_name[block_type][0] && g_property4_name[block_type][0] )
			{
				ToggleProperty(id, 4);
			}
		}
		case K0:
		{
			g_viewing_properties_menu[id] = false;
			ShowBlockMenu(id);
		}
	}
 
	if ( key != K0 ) ShowPropertiesMenu(id, ent);
 
	return PLUGIN_HANDLED;
}
 
public HandleMoveMenu(id, key)
{
	switch ( key )
	{
		case K1: ToggleGridSize(id);
		case K0: ShowBlockMenu(id);
		default:
		{
			static ent, body;
			get_user_aiming(id, ent, body);
 
			if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
			static Float:origin[3];
 
			if ( IsBlockInGroup(id, ent) && g_group_count[id] > 1 )
			{
				static i, block;
 
				new bool:group_is_stuck = true;
 
				for ( i = 0; i <= g_group_count[id]; ++i )
				{
					block = g_grouped_blocks[id][i];
					if ( IsBlockInGroup(id, block) )
					{
						entity_get_vector(block, EV_VEC_origin, origin);
 
						switch ( key )
						{
							case K2: origin[2] += g_grid_size[id];
							case K3: origin[2] -= g_grid_size[id];
							case K4: origin[0] += g_grid_size[id];
							case K5: origin[0] -= g_grid_size[id];
							case K6: origin[1] += g_grid_size[id];
							case K7: origin[1] -= g_grid_size[id];
						}
 
						MoveEntity(id, block, origin, false);
 
						if ( group_is_stuck && !IsBlockStuck(block) )
						{
							group_is_stuck = false;
							break;
						}
					}
				}
 
				if ( group_is_stuck )
				{
					for ( i = 0; i <= g_group_count[id]; ++i )
					{
						block = g_grouped_blocks[id][i];
						if ( IsBlockInGroup(id, block) )
						{
							DeleteBlock(block);
						}
					}
 
					BCM_Print(id, "Group deleted because all the blocks were stuck!");
				}
			}
			else
			{
				entity_get_vector(ent, EV_VEC_origin, origin);
 
				switch ( key )
				{
					case K2: origin[2] += g_grid_size[id];
					case K3: origin[2] -= g_grid_size[id];
					case K4: origin[0] += g_grid_size[id];
					case K5: origin[0] -= g_grid_size[id];
					case K6: origin[1] += g_grid_size[id];
					case K7: origin[1] -= g_grid_size[id];
				}
 
				MoveEntity(id, ent, origin, false);
 
				if ( IsBlockStuck(ent) )
				{
					new bool:deleted = DeleteBlock(ent);
					if ( deleted ) BCM_Print(id, "Block deleted because it was stuck!");
				}
			}
		}
	}
 
	if ( key != K0 ) ShowMoveMenu(id);
 
	return PLUGIN_HANDLED;
}
 
public HandleTeleportMenu(id, key)
{
	switch ( key )
	{
		case K1: CreateTeleportAiming(id, TELEPORT_START);
		case K2: CreateTeleportAiming(id, TELEPORT_DESTINATION);
		case K3: DeleteTeleportAiming(id);
		case K4: SwapTeleportAiming(id);
		case K5: ShowTeleportPath(id);
		case K0: ShowMainMenu(id);
	}
 
	if ( key != K9 && key != K0 ) ShowTeleportMenu(id);
}
 
public HandleLightMenu(id, key)
{
	switch ( key )
	{
		case K1: CreateLightAiming(id);
		case K2: DeleteLightAiming(id);
		case K3: SetPropertiesLightAiming(id);
		case K0: ShowMainMenu(id);
	}
 
	if ( key != K3 && key != K0 ) ShowLightMenu(id);
}
 
public HandleLightPropertiesMenu(id, key)
{
	new ent = g_light_property_info[id][1];
	if ( !is_valid_ent(ent) )
	{
		BCM_Print(id, "That light has been deleted!");
		g_viewing_light_properties_menu[id] = false;
		ShowLightMenu(id);
		return PLUGIN_HANDLED;
	}
 
	switch ( key )
	{
		case K1: g_light_property_info[id][0] = 1;
		case K2: g_light_property_info[id][0] = 2;
		case K3: g_light_property_info[id][0] = 3;
		case K4: g_light_property_info[id][0] = 4;
		case K0:
		{
			g_viewing_light_properties_menu[id] = false;
			ShowLightMenu(id);
		}
	}
 
	if ( key != K0 )
	{
		BCM_Print(id, "Type the new property value for the light.");
		client_cmd(id, "messagemode BCM_SetLightProperty");
		ShowLightPropertiesMenu(id, ent);
	}
 
	return PLUGIN_HANDLED;
}
 
public HandleOptionsMenu(id, key)
{
	switch ( key )
	{
		case K1: ToggleSnapping(id);
		case K2: ToggleSnappingGap(id);
		case K3: GroupBlockAiming(id);
		case K4: ClearGroup(id);
		case K5:
		{
			if ( g_admin[id] )	ShowChoiceMenu(id, CHOICE_DELETE, "Czy jestes pewien, ze chcesz usunac wszystkie bloki i teleporty?");
			else			ShowOptionsMenu(id);
		}
		case K6: 
		{
			SaveBlocks(id);
		}
		case K7:
		{
			if ( g_admin[id] )	ShowChoiceMenu(id, CHOICE_LOAD, "Wczytanie usunie wszystkie bloki i teleporty, czy chcesz kontynuowac?");
			else			ShowOptionsMenu(id);
		}
		case K0: ShowMainMenu(id);
	}
 
	if ( key != K5 && key != K7 && key != K0 ) ShowOptionsMenu(id);
}
 
public HandleChoiceMenu(id, key)
{
	switch ( key )
	{
		case K1:
		{
			switch ( g_choice_option[id] )
			{
				case CHOICE_DELETE:	DeleteAll(id, true);
				case CHOICE_LOAD:	LoadBlocks(id);
			}
		}
		case K2: ShowOptionsMenu(id);
	}
 
	ShowOptionsMenu(id);
}
 
public HandleCommandsMenu(id, key)
{
	switch ( key )
	{
		case K1: CmdSaveCheckpoint(id);
		case K2: CmdLoadCheckpoint(id);
		case K3: CmdReviveYourself(id);
		case K4: CmdRevivePlayer(id);
		case K5: CmdReviveEveryone(id);
		case K6: ToggleAllGodmode(id);
		case K7: CmdGiveAccess(id);
		case K0:
		{
			g_viewing_commands_menu[id] = false;
			ShowMainMenu(id);
		}
	}
 
	if ( key != K0 ) ShowCommandsMenu(id);
}
 
stock bool:CanUseNoclip(id)
{
	return (g_admin[id] || g_gived_access[id]);
}
 
public CmdNoclipToggle(id)
{
	if ( !id || !g_connected[id] || !CanUseNoclip(id) )
	{
		client_print(id, print_center, "Brak dostepu!");
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	ToggleNoclip(id);
	client_print(id, print_center, g_noclip[id] ? "Noclip: ON" : "Noclip: OFF");
	return PLUGIN_HANDLED;
}
 
public CmdNoclipSpeed(id)
{
	if ( !id || !g_connected[id] || !CanUseNoclip(id) )
	{
		client_print(id, print_center, "Brak dostepu!");
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	new arg[8];
	read_argv(1, arg, charsmax(arg));
 
	if ( arg[0] < '1' || arg[0] > '5' || arg[1] )
	{
		console_print(id, "Uzycie: bm_noclip_speed <1-5>");
		client_print(id, print_center, "Uzycie: bm_noclip_speed 1-5");
		return PLUGIN_HANDLED;
	}
 
	g_noclip_mul[id] = arg[0] - '0';
	SyncNoclipPrediction(id);
	client_print(id, print_center, "Noclip speed: %d", g_noclip_mul[id]);
	console_print(id, "Noclip speed: %d", g_noclip_mul[id]);
	return PLUGIN_HANDLED;
}
 
stock SyncNoclipPrediction(id)
{
	if ( !is_user_connected(id) )
	{
		return;
	}
 
	if ( g_noclip[id] && g_noclip_mul[id] > 1 )
	{
		client_cmd(id, "cl_nopred 1");
	}
	else
	{
		client_cmd(id, "cl_nopred 0");
	}
}
 
ToggleNoclip(id)
{
	if ( g_admin[id] || g_gived_access[id] )
	{
		set_user_noclip(id, g_noclip[id] ? 0 : 1);
		g_noclip[id] = !g_noclip[id];
		SyncNoclipPrediction(id);
	}
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
	if ( g_noclip[id] )	BCM_Print(0, "^1%s^3 wlaczyl noclip!", admin_name);
	else			BCM_Print(0, "^1%s^3 wylaczyl noclip!", admin_name);
}
 
ToggleGodmode(id)
{
	if ( g_admin[id] || g_gived_access[id] )
	{
		set_user_godmode(id, g_godmode[id] ? 0 : 1);
		g_godmode[id] = !g_godmode[id];
	}
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
	if ( g_godmode[id] )	BCM_Print(0, "^1%s^3 wlaczyl godmode!", admin_name);
	else			BCM_Print(0, "^1%s^3 wylaczyl godmode!", admin_name);
}
 
ToggleGridSize(id)
{
	g_grid_size[id] *= 2;
 
	{
		g_grid_size[id] = 1.0;
	}
}
 
ToggleSnapping(id)
{
	if ( g_admin[id] || g_gived_access[id] )
	{
		g_snapping[id] = !g_snapping[id];
	}
}
 
ToggleSnappingGap(id)
{
	if ( g_admin[id] || g_gived_access[id] )
	{
		g_snapping_gap[id] += 4.0;
 
		if ( g_snapping_gap[id] > 40.0 )
		{
			g_snapping_gap[id] = 0.0;
		}
	}
}
 
public CmdSaveCheckpoint(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
	else if ( !g_alive[id] )
	{
		BCM_Print(id, "Musisz byc zywy!");
		return PLUGIN_HANDLED;
	}
	else if ( g_noclip[id] )
	{
		BCM_Print(id, "Nie mozesz zapisac checkpointu majac noclipa!");
		return PLUGIN_HANDLED;
	}
 
	static Float:velocity[3];
	get_user_velocity(id, velocity);
 
	new button =	entity_get_int(id, EV_INT_button);
	new flags =	entity_get_int(id, EV_INT_flags);
 
	if ( !( ( velocity[2] >= 0.0 || ( flags & FL_INWATER ) ) && !( button & IN_JUMP ) && velocity[2] <= 0.0 ) )
	{
		BCM_Print(id, "Nie mozesz zapisac checkpointu podczas poruszania sie w gore badz dol!");
		return PLUGIN_HANDLED;
	}
 
	if ( flags & FL_DUCKING )	g_checkpoint_duck[id] = true;
	else				g_checkpoint_duck[id] = false;
 
	entity_get_vector(id, EV_VEC_origin, g_checkpoint_position[id]);
 
	BCM_Print(id, "Checkpoint zapisany!");
 
	if ( !g_has_checkpoint[id] )		g_has_checkpoint[id] = true;
 
	if ( g_viewing_commands_menu[id] )	ShowCommandsMenu(id);
 
	return PLUGIN_HANDLED;
}
 
public CmdLoadCheckpoint(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
	else if ( !g_alive[id] )
	{
		BCM_Print(id, "Musisz byc zywy!");
		return PLUGIN_HANDLED;
	}
	else if ( !g_has_checkpoint[id] )
	{
		BCM_Print(id, "Nie masz zapisanego checkpointu!");
		return PLUGIN_HANDLED;
	}
 
	static Float:origin[3];
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( i == id
		|| !g_alive[i] ) continue;
 
		entity_get_vector(id, EV_VEC_origin, origin);
 
		if ( get_distance_f(g_checkpoint_position[id], origin) <= 35.0 )
		{
			if ( cs_get_user_team(i) == cs_get_user_team(id) ) continue;
 
			BCM_Print(id, "Ktos jest za blisko checkpointu!");
			return PLUGIN_HANDLED;
		}
	}
 
	entity_set_vector(id, EV_VEC_origin, g_checkpoint_position[id]);
	entity_set_vector(id, EV_VEC_velocity, Float:{ 0.0, 0.0, 0.0 });
 
	if ( g_checkpoint_duck[id] )
	{
		entity_set_int(id, EV_INT_flags, entity_get_int(id, EV_INT_flags) | FL_DUCKING);
	}
 
	return PLUGIN_HANDLED;
}
 
public CmdReviveYourself(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
	else if ( g_alive[id] )
	{
		BCM_Print(id, "Jestes zywy!");
		return PLUGIN_HANDLED;
	}
 
	ExecuteHam(Ham_CS_RoundRespawn, id);
	BCM_Print(id, "Odrodziles siebie!");
 
	static name[32];
	get_user_name(id, name, charsmax(name));
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i]
		|| i == id ) continue;
 
		BCM_Print(i, "^1%s^3 wskrzesil sie!", name);
	}
 
	return PLUGIN_HANDLED;
}
 
CmdRevivePlayer(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	client_cmd(id, "messagemode BCM_Revive");
	BCM_Print(id, "Wpisz nick osoby, ktora chcesz ozywic.");
 
	return PLUGIN_HANDLED;
}
 
public RevivePlayer(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static arg[32], target;
	read_argv(1, arg, charsmax(arg));
 
	target = cmd_target(id, arg, CMDTARGET_NO_BOTS);
	if ( !target ) return PLUGIN_HANDLED;
	else if ( id == target )
	{
		CmdReviveYourself(id);
		return PLUGIN_HANDLED;
	}
 
	static target_name[32];
	get_user_name(target, target_name, charsmax(target_name));
 
	if ( g_admin[target]
	|| g_gived_access[target] )
	{
		BCM_Print(id, "^1%s^3 jest adminem. Sam moze sie ozywic!", target_name);
		return PLUGIN_HANDLED;
	}
	else if ( g_alive[target] )
	{
		BCM_Print(id, "^1%s^3 jest zywy!", target_name);
		return PLUGIN_HANDLED;
	}
 
	ExecuteHam(Ham_CS_RoundRespawn, target);
 
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
 
	BCM_Print(id, "Wskrzesiles^1 %s^3!", target_name);
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i]
		|| i == id
		|| i == target ) continue;
 
		BCM_Print(i, "^1%s^3 wskrzes^1 %s^3!", admin_name, target_name);
	}
 
	BCM_Print(target, "Zostales ozywiony przez^1 %s^3!", admin_name);
 
	return PLUGIN_HANDLED;
}
 
CmdReviveEveryone(id)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i]
		|| g_admin[i]
		|| g_gived_access[i]
		|| g_alive[i] ) continue;
 
		ExecuteHam(Ham_CS_RoundRespawn, i);
	}
 
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
 
	BCM_Print(0, "^1%s^3 Wskrzesil wszystkich!", admin_name);
 
	return PLUGIN_HANDLED;
}
 
ToggleAllGodmode(id)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i] ) continue;
 
		if ( g_alive[i]
		&& !g_admin[i]
		&& !g_gived_access[i] )
		{
			entity_set_float(i, EV_FL_takedamage, g_all_godmode ? DAMAGE_AIM : DAMAGE_NO);
		}
 
		if ( g_viewing_commands_menu[i] ) ShowCommandsMenu(i);
	}
 
	g_all_godmode = !g_all_godmode;
 
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
 
	if ( g_all_godmode )	BCM_Print(0, "^1%s^3 dal wszystkim niesmiertelnosc!", admin_name);
	else			BCM_Print(0, "^1%s^3 zabral wszystkim niesmiertelnosc!", admin_name);
 
	return PLUGIN_HANDLED;
}
 
CmdGiveAccess(id)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	client_cmd(id, "messagemode BCM_GiveAccess");
	BCM_Print(id, "Wpisz nick gracza ktoremu chcesz dac dostep %s.", PLUGIN_PREFIX);
 
	return PLUGIN_HANDLED;
}
 
public GiveAccess(id)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static arg[32], target;
	read_argv(1, arg, charsmax(arg));
 
	target = cmd_target(id, arg, CMDTARGET_NO_BOTS);
	if ( !target ) return PLUGIN_HANDLED;
 
	static target_name[32];
	get_user_name(target, target_name, charsmax(target_name));
 
	if ( g_admin[target] || g_gived_access[target] )
	{
		BCM_Print(id, "^1%s^3 juz ma Blockmakera!", target_name, PLUGIN_PREFIX);
		return PLUGIN_HANDLED;
	}
 
	g_gived_access[target] = true;
 
	BCM_Print(id, "Dales Blockmakera %s!", target_name, PLUGIN_PREFIX);
 
	static admin_name[32];
	get_user_name(id, admin_name, charsmax(admin_name));
 
	BCM_Print(target, "^1%s^3 Dostales dostep do Blockmakera!", admin_name, PLUGIN_PREFIX, PLUGIN_PREFIX);
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( i == id
		|| i == target
		|| !g_connected[i] ) continue;
 
		BCM_Print(i, "^1%s^3 dal^1 %s^3 Blockmakera!", admin_name, target_name, PLUGIN_PREFIX);
	}
 
	return PLUGIN_HANDLED;
}
 
public CmdShowInfo(id)
{
	static text[1120], len, textures[32], title[64];
 
	get_pcvar_string(g_cvar_textures, textures, charsmax(textures));
 
	len += format(text[len], charsmax(text) - len, "<html>");
 
	len += format(text[len], charsmax(text) - len, "<style type = ^"text/css^">");
 
	len += format(text[len], charsmax(text) - len, "body");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len, 	"background-color:#000000;");
	len += format(text[len], charsmax(text) - len,	"font-family:Comic Sans MS;");
	len += format(text[len], charsmax(text) - len,	"font-weight:bold;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "h1");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len,	"color:#00FF00;");
	len += format(text[len], charsmax(text) - len,	"font-size:large;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "h2");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len,	"color:#00FF00;");
	len += format(text[len], charsmax(text) - len,	"font-size:medium;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "h3");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len,	"color:#0096FF;");
	len += format(text[len], charsmax(text) - len,	"font-size:medium;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "h4");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len,	"color:#FFFFFF;");
	len += format(text[len], charsmax(text) - len,	"font-size:medium;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "h5");
	len += format(text[len], charsmax(text) - len, "{");
	len += format(text[len], charsmax(text) - len,	"color:#FFFFFF;");
	len += format(text[len], charsmax(text) - len,	"font-size:x-small;");
	len += format(text[len], charsmax(text) - len, "}");
 
	len += format(text[len], charsmax(text) - len, "</style>");
 
	len += format(text[len], charsmax(text) - len, "<body>");
	len += format(text[len], charsmax(text) - len, "<div align = ^"center^">");
 
	len += format(text[len], charsmax(text) - len, "<h1>");
	len += format(text[len], charsmax(text) - len, "%s v%s", PLUGIN_NAME, PLUGIN_VERSION);
	len += format(text[len], charsmax(text) - len, "</h1>");
 
	len += format(text[len], charsmax(text) - len, "<h4>");
	len += format(text[len], charsmax(text) - len, "UltraSkill");
	len += format(text[len], charsmax(text) - len, "</h4>");
 
	len += format(text[len], charsmax(text) - len, "<h1>");
	len += format(text[len], charsmax(text) - len, "Texture Design");
	len += format(text[len], charsmax(text) - len, "</h1>");
 
	len += format(text[len], charsmax(text) - len, "<h4>");
	len += format(text[len], charsmax(text) - len, "by Colgate %s", textures);
	len += format(text[len], charsmax(text) - len, "</h4>");
 
	len += format(text[len], charsmax(text) - len, "<h2>");
	len += format(text[len], charsmax(text) - len, "Grabbing Blocks:");
	len += format(text[len], charsmax(text) - len, "</h3>");
 
	len += format(text[len], charsmax(text) - len, "<h5>");
	len += format(text[len], charsmax(text) - len, "Bind a key to +bmgrab to move the blocks around.<br />", PLUGIN_PREFIX);
	len += format(text[len], charsmax(text) - len, "Eg: <I>Bind v +bmgrab.</I>", PLUGIN_PREFIX);
	len += format(text[len], charsmax(text) - len, "</h5>");
 
	len += format(text[len], charsmax(text) - len, "<h2>");
	len += format(text[len], charsmax(text) - len, "Commands while grabbing a block:");
	len += format(text[len], charsmax(text) - len, "</h2>");
 
	len += format(text[len], charsmax(text) - len, "<h5>");
	len += format(text[len], charsmax(text) - len, "<I>+Attack</I>: Copies the block.<br />");
	len += format(text[len], charsmax(text) - len, "<I>+Attack2</I>: Deletes the block.<br />");
	len += format(text[len], charsmax(text) - len, "<I>+Reload</I>: Rotates the block.<br />");
	len += format(text[len], charsmax(text) - len, "<I>+Jump</I>: Moves the block closer to you.<br />");
	len += format(text[len], charsmax(text) - len, "<I>+Duck</I>: Moves the block further away from you.");
	len += format(text[len], charsmax(text) - len, "</h5>");
 
	len += format(text[len], charsmax(text) - len, "<h3>");
	len += format(text[len], charsmax(text) - len, "Press <I>+Use</I> to see what block you are aiming at.<br />");
	len += format(text[len], charsmax(text) - len, "Type /bcm to bring up the %s Main Menu.", PLUGIN_PREFIX, PLUGIN_PREFIX);
	len += format(text[len], charsmax(text) - len, "</h3>");
 
	len += format(text[len], charsmax(text) - len, "</div>");
	len += format(text[len], charsmax(text) - len, "</body>");
 
	len += format(text[len], charsmax(text) - len, "</html>");
 
	format(title, charsmax(title) - 1, "%s v%s", PLUGIN_NAME, PLUGIN_VERSION);
	show_motd(id, text, title);
 
	return PLUGIN_HANDLED;
}
 
MoveGrabbedEntity(id, Float:move_to[3] = { 0.0, 0.0, 0.0 })
{
	static aiming[3];
	static look[3];
	static Float:float_aiming[3];
	static Float:float_look[3];
	static Float:direction[3];
	static Float:length;
 
	get_user_origin(id, aiming, 1);
	get_user_origin(id, look, 3);
	IVecFVec(aiming, float_aiming);
	IVecFVec(look, float_look);
 
	direction[0] = float_look[0] - float_aiming[0];
	direction[1] = float_look[1] - float_aiming[1];
	direction[2] = float_look[2] - float_aiming[2];
	length = get_distance_f(float_look, float_aiming);
 
	if ( length == 0.0 ) length = 1.0;
 
	move_to[0] = ( float_aiming[0] + direction[0] * g_grab_length[id] / length ) + g_grab_offset[id][0];
	move_to[1] = ( float_aiming[1] + direction[1] * g_grab_length[id] / length ) + g_grab_offset[id][1];
	move_to[2] = ( float_aiming[2] + direction[2] * g_grab_length[id] / length ) + g_grab_offset[id][2];
	move_to[2] = float(floatround(move_to[2], floatround_floor));
 
	MoveEntity(id, g_grabbed[id], move_to, true);
}
 
MoveEntity(id, ent, Float:move_to[3], bool:do_snapping)
{
	if ( do_snapping ) DoSnapping(id, ent, move_to);
 
	entity_set_origin(ent, move_to);
}
 
CreateBlockAiming(const id, const block_type)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static origin[3];
	static Float:float_origin[3];
 
	get_user_origin(id, origin, 3);
	IVecFVec(origin, float_origin);
	float_origin[2] += 4.0;
 
	CreateBlock(id, block_type, float_origin, Z, g_selected_block_size[id], g_property1_default_value[block_type], g_property2_default_value[block_type], g_property3_default_value[block_type], g_property4_default_value[block_type]);
 
	return PLUGIN_HANDLED;
}
 
CreateBlock(const id, const block_type, Float:origin[3], const axis, const size, const property1[], const property2[], const property3[], const property4[])
{
	new ent = create_entity("info_target");
	if ( !is_valid_ent(ent) ) return 0;
 
	entity_set_string(ent, EV_SZ_classname, g_block_classname);
	entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
	entity_set_int(ent, EV_INT_movetype, MOVETYPE_NONE);
 
	new block_model[256];
	new Float:size_min[3];
	new Float:size_max[3];
	new Float:angles[3];
	new Float:scale;
 
	switch ( axis )
	{
		case X:
		{
			size_min[0] = -4.0;
			size_min[1] = -32.0;
			size_min[2] = -32.0;
 
			size_max[0] = 4.0;
			size_max[1] = 32.0;
			size_max[2] = 32.0;
 
			if(size == POLE)
			{
				size_min[0] = -32.0;
				size_min[1] = -4.0;
				size_min[2] = -4.0;
 
				size_max[0] = 32.0;
				size_max[1] = 4.0;
				size_max[2] = 4.0;
			}
 
 
			angles[0] = 90.0;
		}
		case Y:
		{
			size_min[0] = -32.0;
			size_min[1] = -4.0;
			size_min[2] = -32.0;
 
			size_max[0] = 32.0;
			size_max[1] = 4.0;
			size_max[2] = 32.0;
 
			if(size == POLE)
			{
				size_min[0] = -4.0;
				size_min[1] = -32.0;
				size_min[2] = -4.0;
 
				size_max[0] = 4.0;
				size_max[1] = 32.0;
				size_max[2] = 4.0;
			}
 
			angles[0] = 90.0;
			angles[2] = 90.0;
		}
		case Z:
		{
			size_min[0] = -32.0;
			size_min[1] = -32.0;
			size_min[2] = -4.0;
 
			size_max[0] = 32.0;
			size_max[1] = 32.0;
			size_max[2] = 4.0;
 
			if(size == POLE)
			{
				size_min[0] = -4.0;
				size_min[1] = -4.0;
				size_min[2] = -32.0;
 
				size_max[0] = 4.0;
				size_max[1] = 4.0;
				size_max[2] = 32.0;
			}
 
			angles[0] = 0.0;
			angles[1] = 0.0;
			angles[2] = 0.0;
		}
	}
 
	switch ( size )
	{
		case TINY:
		{
			block_model = g_block_models_tiny[block_type];
			scale = 0.25;
		}
		case NORMAL:
		{
			block_model = g_block_models[block_type];
			scale = 1.0;
		}
		case LARGE:
		{
			block_model = g_block_models_large[block_type];
			scale = 2.0;
		}
		case POLE:
		{
			block_model = g_block_models_pole[block_type];
			scale = 1.0;
		}
	}
 
	for ( new i = 0; i < 3; ++i )
	{
		if ( size_min[i] != 4.0 && size_min[i] != -4.0 )
		{
			size_min[i] *= scale;
		}
 
		if ( size_max[i] != 4.0 && size_max[i] != -4.0 )
		{
			size_max[i] *= scale;
		}
	}
 
	entity_set_model(ent, block_model);
 
	SetBlockRendering(ent, g_render[block_type], g_red[block_type], g_green[block_type], g_blue[block_type], g_alpha[block_type]);
 
	entity_set_vector(ent, EV_VEC_angles, angles);
	entity_set_size(ent, size_min, size_max);
	entity_set_int(ent, EV_INT_body, block_type);
 
	if ( 1 <= id <= g_max_players )
	{
		DoSnapping(id, ent, origin);
	}
 
	entity_set_origin(ent, origin);
 
	SetProperty(ent, 1, property1);
	SetProperty(ent, 2, property2);
	SetProperty(ent, 3, property3);
	SetProperty(ent, 4, property4);
 
	return ent;
}
 
ConvertBlockAiming(id, const convert_to)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	new grabber = entity_get_int(ent, EV_INT_iuser2);
	if ( grabber && grabber != id ) return PLUGIN_HANDLED;
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( player && player != id )
	{
		new player_name[32]; 
		get_user_name(player, player_name, charsmax(player_name));
 
		BCM_Print(id, "^1%s^3 currently has this block in their group!", player_name);
		return PLUGIN_HANDLED;
	}
 
	static new_block;
	if ( IsBlockInGroup(id, ent) && g_group_count[id] > 1 )
	{
		static i, block, block_count;
 
		block_count = 0;
		for ( i = 0; i <= g_group_count[id]; ++i )
		{
			block = g_grouped_blocks[id][i];
			if ( !IsBlockInGroup(id, block) ) continue;
 
			new_block = ConvertBlock(id, block, convert_to, true);
			if ( new_block != 0 )
			{
				g_grouped_blocks[id][i] = new_block;
 
				GroupBlock(id, new_block);
			}
			else
			{
				++block_count;
			}
		}
 
		if ( block_count > 1 )
		{
			BCM_Print(id, "Couldn't convert^1 %d^3 blocks!", block_count);
		}
	}
	else
	{
		new_block = ConvertBlock(id, ent, convert_to, false);
		if ( IsBlockStuck(new_block) )
		{
			new bool:deleted = DeleteBlock(new_block);
			if ( deleted ) BCM_Print(id, "Kurwa blok Ci utknal!");
		}
	}
 
	return PLUGIN_HANDLED;
}
 
ConvertBlock(id, ent, const convert_to, const bool:preserve_size)
{
	new axis;
	new block_type;
	new property1[5], property2[5], property3[5], property4[5];
	new Float:origin[3];
	new Float:size_max[3];
 
	block_type = entity_get_int(ent, EV_INT_body);
 
	entity_get_vector(ent, EV_VEC_origin, origin);
	entity_get_vector(ent, EV_VEC_maxs, size_max);
 
	for ( new i = 0; i < 3; ++i )
	{
		if ( size_max[i] == 4.0 )
		{
			axis = i;
			break;
		}
	}
 
	GetProperty(ent, 1, property1);
	GetProperty(ent, 2, property2);
	GetProperty(ent, 3, property3);
	GetProperty(ent, 4, property4);
 
	if ( block_type != convert_to )
	{
		copy(property1, charsmax(property1), g_property1_default_value[convert_to]);
		copy(property2, charsmax(property1), g_property2_default_value[convert_to]);
		copy(property3, charsmax(property1), g_property3_default_value[convert_to]);
		copy(property4, charsmax(property1), g_property4_default_value[convert_to]);
	}
 
	DeleteBlock(ent);
 
	if ( preserve_size )
	{
		static size, Float:max_size;
 
		max_size = size_max[0] + size_max[1] + size_max[2];
 
		if ( max_size > 128.0 )		size = LARGE;
		else if ( max_size > 64.0 )	size = NORMAL;
		else if( max_size > 32.0 ) 	size = POLE;
		else				size = TINY;
 
		return CreateBlock(id, convert_to, origin, axis, size, property1, property2, property3, property4);
	}
	else
	{
		return CreateBlock(id, convert_to, origin, axis, g_selected_block_size[id], property1, property2, property3, property4);
	}
 
	return ent;
}
 
DeleteBlockAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	new grabber = entity_get_int(ent, EV_INT_iuser2);
	if ( grabber && grabber != id ) return PLUGIN_HANDLED;
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( player && player != id )
	{
		new player_name[32]; 
		get_user_name(player, player_name, charsmax(player_name));
 
		BCM_Print(id, "^1%s^3 currently has this block in their group!", player_name);
		return PLUGIN_HANDLED;
	}
 
	if ( IsBlockInGroup(id, ent) && g_group_count[id] > 1 )
	{
		static i, block;
		for ( i = 0; i <= g_group_count[id]; ++i )
		{
			block = g_grouped_blocks[id][i];
			if ( !is_valid_ent(block) ) continue;
 
			DeleteBlock(block);
		}
 
		return PLUGIN_HANDLED;
	}
 
	DeleteBlock(ent);
 
	return PLUGIN_HANDLED;
}
 
bool:DeleteBlock(ent)
{
	if ( !IsBlock(ent) ) return false;
 
	remove_entity(ent);
	return true;
}
 
RotateBlockAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepp");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	new grabber = entity_get_int(ent, EV_INT_iuser2);
	if ( grabber && grabber != id ) return PLUGIN_HANDLED;
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( player && player != id )
	{
		static player_name[32]; 
		get_user_name(player, player_name, charsmax(player_name));
 
		BCM_Print(id, "^1%s^3 currently has this block in their group!", player_name);
		return PLUGIN_HANDLED;
	}
 
	if ( IsBlockInGroup(id, ent) && g_group_count[id] > 1 )
	{
		static block;
		for ( new i = 0; i <= g_group_count[id]; ++i )
		{
			block = g_grouped_blocks[id][i];
			if ( IsBlockInGroup(id, block) ) RotateBlock(block);
		}
	}
	else
	{
		RotateBlock(ent);
	}
 
	return PLUGIN_HANDLED;
}
 
RotateBlock(ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	static Float:angles[3];
	static Float:size_min[3];
	static Float:size_max[3];
	static Float:temp;
 
	entity_get_vector(ent, EV_VEC_angles, angles);
	entity_get_vector(ent, EV_VEC_mins, size_min);
	entity_get_vector(ent, EV_VEC_maxs, size_max);
 
	if ( angles[0] == 0.0 && angles[2] == 0.0 )
	{
		angles[0] = 90.0;
	}
	else if ( angles[0] == 90.0 && angles[2] == 0.0 )
	{
		angles[0] = 90.0;
		angles[2] = 90.0;
	}
	else
	{
		angles[0] = 0.0;
		angles[1] = 0.0;
		angles[2] = 0.0;
	}
 
	temp = size_min[0];
	size_min[0] = size_min[2];
	size_min[2] = size_min[1];
	size_min[1] = temp;
 
	temp = size_max[0];
	size_max[0] = size_max[2];
	size_max[2] = size_max[1];
	size_max[1] = temp;
 
	entity_set_vector(ent, EV_VEC_angles, angles);
	entity_set_size(ent, size_min, size_max);
 
	return true;
}
 
ChangeBlockSize(id)
{
	switch ( g_selected_block_size[id] )
	{
		case TINY:	g_selected_block_size[id] = NORMAL;
		case NORMAL:	g_selected_block_size[id] = LARGE;
		case LARGE:	g_selected_block_size[id] = POLE;
		case POLE:	g_selected_block_size[id] = TINY;
	}
}
 
SetPropertiesBlockAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsBlock(ent) )
	{
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	new block_type = entity_get_int(ent, EV_INT_body);
 
	if ( !g_property1_name[block_type][0]
	&& !g_property2_name[block_type][0]
	&& !g_property3_name[block_type][0]
	&& !g_property4_name[block_type][0] )
	{
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	g_viewing_properties_menu[id] = true;
	ShowPropertiesMenu(id, ent);
 
	return PLUGIN_HANDLED;
}
 
public SetPropertyBlock(id)
{
	static arg[5];
	read_argv(1, arg, charsmax(arg));
 
	if ( !strlen(arg) )
	{
		BCM_Print(id, "You can't set a property blank! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetProperty");
		return PLUGIN_HANDLED;
	}
	else if ( !IsStrFloat(arg) )
	{
		BCM_Print(id, "You can't use letters in a property! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetProperty");
		return PLUGIN_HANDLED;
	}
 
	new ent = g_property_info[id][1];
	if ( !is_valid_ent(ent) )
	{
		BCM_Print(id, "That block has been deleted!");
		g_viewing_properties_menu[id] = false;
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	static block_type;
	static property;
	static Float:property_value;
 
	block_type = entity_get_int(ent, EV_INT_body);
	property = g_property_info[id][0];
	property_value = str_to_float(arg);
 
	if ( property == 3
	&& block_type != BOOTS_OF_SPEED )
	{
		if ( !( 50 <= property_value <= 200 
		|| property_value == 255
		|| property_value == 0 ) )
		{
			BCM_Print(id, "The property has to be between^1 50^3 and^1 200^3,^1 255^3 or^1 0^3!");
			return PLUGIN_HANDLED;
		}
	}
	else
	{
		switch ( block_type )
		{
			case DAMAGE, HEALER, ARMOR:
			{
				if ( property == 1
				&& !( 1 <= property_value <= 100 ) )
				{
					BCM_Print(id, "The property has to be between^1 1^3 and^1 100^3!");
					return PLUGIN_HANDLED;
				}
				else if ( !( 0.1 <= property_value <= 240 ) )
				{
					BCM_Print(id, "The property has to be between^1 0.1^3 and^1 240^3!");
					return PLUGIN_HANDLED;
				}
			}
			case TRAMPOLINE:
			{
				if ( !( 200 <= property_value <= 2000 ) )
				{
					BCM_Print(id, "The property has to be between^1 200^3 and^1 2000^3!");
					return PLUGIN_HANDLED;
				}
			}
			case SPEED_BOOST:
			{
				if ( property == 1
				&& !( 200 <= property_value <= 2000 ) )
				{
					BCM_Print(id, "The property has to be between^1 200^3 and^1 2000^3!");
					return PLUGIN_HANDLED;
				}
				else if ( !( 0 <= property_value <= 2000 ) )
				{
					BCM_Print(id, "The property has to be between^1 0^3 and^1 2000^3!");
					return PLUGIN_HANDLED;
				}
			}
			case HONEY:
			{
				if ( !( 75 <= property_value <= 200
				|| property_value == 0 ) )
				{
					BCM_Print(id, "The property has to be between^1 75^3 and^1 200^3, or^1 0^3!");
					return PLUGIN_HANDLED;
				}
			}
			case DELAYED_BUNNYHOP:
			{
				if ( !( 0.5 <= property_value <= 5 ) )
				{
					BCM_Print(id, "The property has to be between^1 0.5^3 and^1 5^3!");
					return PLUGIN_HANDLED;
				}
			}
			case INVINCIBILITY, STEALTH, BOOTS_OF_SPEED:
			{
				if ( property == 1
				&& !( 0.5 <= property_value <= 240 ) )
				{
					BCM_Print(id, "The property has to be between^1 0.5^3 and^1 240^3!");
					return PLUGIN_HANDLED;
				}
				else if ( property == 2
				&& !( 0 <= property_value <= 240 ) )
				{
					BCM_Print(id, "The property has to be between^1 0^3 and^1 240^3!");
					return PLUGIN_HANDLED;
				}
				else if ( property == 3
				&& block_type == BOOTS_OF_SPEED
				&& !( 260 <= property_value <= 400 ) )
				{
					BCM_Print(id, "The property has to be between^1 260^3 and^1 400^3!");
					return PLUGIN_HANDLED;
				}
			}
		}	
	}
 
	SetProperty(ent, property, arg);
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i]
		|| !g_viewing_properties_menu[i] ) continue;
 
		ent = g_property_info[i][1];
		ShowPropertiesMenu(i, ent);
	}
 
	return PLUGIN_HANDLED;
}
 
ToggleProperty(id, property)
{
	new ent = g_property_info[id][1];
	if ( !is_valid_ent(ent) )
	{
		BCM_Print(id, "That block has been deleted!");
		g_viewing_properties_menu[id] = false;
		ShowBlockMenu(id);
		return PLUGIN_HANDLED;
	}
 
	static property_value[5];
	GetProperty(ent, property, property_value);
	new block_type = entity_get_int(ent, EV_INT_body);
	if(block_type == DEATH && property == '1')
	{
		fm_set_rendering(ent, kRenderFxGlowShell, 70, 0, 150, kRenderNormal, 1);
	}
	if ( property_value[0] == '0' )		copy(property_value, charsmax(property_value), "1");
	else					copy(property_value, charsmax(property_value), "0");
 
	SetProperty(ent, property, property_value);
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( g_connected[i] && g_viewing_properties_menu[i] )
		{
			ent = g_property_info[i][1];
			ShowPropertiesMenu(i, ent);
		}
	}
 
	return PLUGIN_HANDLED;
}
 
GetProperty(ent, property, property_value[])
{
	switch ( property )
	{
		case 1: pev(ent, pev_message, property_value, 13);
		case 2: pev(ent, pev_netname, property_value, 10);
		case 3: pev(ent, pev_viewmodel2, property_value, 10);
		case 4: pev(ent, pev_weaponmodel2, property_value, 10);
	}
	return (strlen(property_value) ? 1 : 0);
}
 
SetProperty(ent, property, const property_value[])
{
	switch ( property )
	{
		case 1: set_pev(ent, pev_message, property_value, 15);
		case 2: set_pev(ent, pev_netname, property_value, 5);
		case 3: set_pev(ent, pev_viewmodel2, property_value, 5);
		case 4: set_pev(ent, pev_weaponmodel2, property_value, 5);
	}
 
	return 1;
}
 
CopyBlock(ent)
{
	if ( !is_valid_ent(ent) ) return 0;
 
	new size;
	new axis;
	new property1[5], property2[5], property3[5], property4[5];
	new Float:origin[3];
	new Float:angles[3];
	new Float:size_min[3];
	new Float:size_max[3];
	new Float:max_size;
 
	entity_get_vector(ent, EV_VEC_origin, origin);
	entity_get_vector(ent, EV_VEC_angles, angles);
	entity_get_vector(ent, EV_VEC_mins, size_min);
	entity_get_vector(ent, EV_VEC_maxs, size_max);
 
	max_size = size_max[0] + size_max[1] + size_max[2];
 
	if ( max_size > 128.0 )		size = LARGE;
	else if ( max_size > 64.0 )	size = NORMAL;
	else if ( max_size > 32.0 )	size = POLE;
	else				size = TINY;
 
	for ( new i = 0; i < 3; ++i )
	{
		if ( size_max[i] == 4.0 )
		{
			axis = i;
			break;
		}
	}
 
	GetProperty(ent, 1, property1);
	GetProperty(ent, 2, property2);
	GetProperty(ent, 3, property3);
	GetProperty(ent, 4, property4);
 
	return CreateBlock(0, entity_get_int(ent, EV_INT_body), origin, axis, size, property1, property2, property3, property4);
}
 
GroupBlockAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( !player )
	{
		++g_group_count[id];
		g_grouped_blocks[id][g_group_count[id]] = ent;
		GroupBlock(id, ent);
 
	}
	else if ( player == id )
	{
		UnGroupBlock(ent);
	}
	else
	{
		static player, name[32];
 
		player = entity_get_int(ent, EV_INT_iuser1);
		get_user_name(player, name, charsmax(name));
 
		BCM_Print(id, "Block is already in a group by:^1 %s", name);
	}
 
	return PLUGIN_HANDLED;
}
 
GroupBlock(id, ent)
{
	if ( !is_valid_ent(ent) ) return PLUGIN_HANDLED;
 
	if ( 1 <= id <= g_max_players )
	{
		entity_set_int(ent, EV_INT_iuser1, id);
	}
 
	set_rendering(ent, kRenderFxGlowShell, 255, 0, 0, kRenderNormal, 16);
 
	return PLUGIN_HANDLED;
}
 
UnGroupBlock(ent)
{
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	entity_set_int(ent, EV_INT_iuser1, 0);
 
	new block_type = entity_get_int(ent, EV_INT_body);
	SetBlockRendering(ent, g_render[block_type], g_red[block_type], g_green[block_type], g_blue[block_type], g_alpha[block_type]);
 
	return PLUGIN_HANDLED;
}
 
ClearGroup(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static block;
	static block_count;
	static blocks_deleted;
 
	block_count = 0;
	blocks_deleted = 0;
	for ( new i = 0; i <= g_group_count[id]; ++i )
	{
		block = g_grouped_blocks[id][i];
		if ( IsBlockInGroup(id, block) )
		{
			if ( IsBlockStuck(block) )
			{
				DeleteBlock(block);
				++blocks_deleted;
			}
			else
			{
				UnGroupBlock(block);
				++block_count;
			}
		}
	}
 
	g_group_count[id] = 0;
 
	if ( g_connected[id] )
	{
		if ( blocks_deleted > 0 )
		{
			BCM_Print(id, "Removed^1 %d^3 blocks from group. Deleted^1 %d^3 stuck blocks!", block_count, blocks_deleted);
		}
		else
		{
			BCM_Print(id, "Removed^1 %d^3 blocks from group!", block_count);
		}
	}
 
	return PLUGIN_HANDLED;
}
 
SetBlockRendering(ent, type, red, green, blue, alpha)
{
	if ( !IsBlock(ent) ) return PLUGIN_HANDLED;
 
	switch ( type )
	{
		case GLOWSHELL: fm_set_rendering(ent, kRenderFxGlowShell, red, green, blue, kRenderNormal, alpha);
		case TRANSCOLOR: fm_set_rendering(ent, kRenderFxGlowShell, red, green, blue, kRenderTransColor, alpha);
		case TRANSALPHA: fm_set_rendering(ent, kRenderFxNone, red, green, blue, kRenderTransColor, alpha);
		case TRANSWHITE: fm_set_rendering(ent, kRenderFxNone, red, green, blue, kRenderTransAdd, alpha);
		case GLOWALPHA: fm_set_rendering(ent, kRenderFxGlowShell, red, green, blue, kRenderTransTexture, alpha);
		case HOLOGRAM: fm_set_rendering(ent, kRenderFxHologram, red, green, blue, kRenderNormal, alpha);
		case FADEFAST: fm_set_rendering(ent, kRenderFxPulseSlowWide, red, green, blue, kRenderTransAlpha, alpha);
		default: fm_set_rendering(ent, kRenderFxNone, red, green, blue, kRenderNormal, alpha);
	}
 
	return PLUGIN_HANDLED;
}
 
bool:IsBlock(ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	static classname[32];
	entity_get_string(ent, EV_SZ_classname, classname, charsmax(classname));
 
	if ( equal(classname, g_block_classname) )
	{
		return true;
	}
 
	return false;
}
 
bool:IsBlockInGroup(id, ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	new player = entity_get_int(ent, EV_INT_iuser1);
	if ( player == id ) return true;
 
	return false;
}
 
bool:IsBlockStuck(ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	new content;
	new Float:origin[3];
	new Float:point[3];
	new Float:size_min[3];
	new Float:size_max[3];
 
	entity_get_vector(ent, EV_VEC_mins, size_min);
	entity_get_vector(ent, EV_VEC_maxs, size_max);
 
	entity_get_vector(ent, EV_VEC_origin, origin);
 
	size_min[0] += 1.0;
	size_min[1] += 1.0;
	size_min[2] += 1.0;
 
	size_max[0] -= 1.0;
	size_max[1] -= 1.0; 
	size_max[2] -= 1.0;
 
	for ( new i = 0; i < 14; ++i )
	{
		point = origin;
 
		switch ( i )
		{
			case 0:
			{
				point[0] += size_max[0];
				point[1] += size_max[1];
				point[2] += size_max[2];
			}
			case 1:
			{
				point[0] += size_min[0];
				point[1] += size_max[1];
				point[2] += size_max[2];
			}
			case 2:
			{
				point[0] += size_max[0];
				point[1] += size_min[1];
				point[2] += size_max[2];
			}
			case 3:
			{
				point[0] += size_min[0];
				point[1] += size_min[1];
				point[2] += size_max[2];
			}
			case 4:
			{
				point[0] += size_max[0];
				point[1] += size_max[1];
				point[2] += size_min[2];
			}
			case 5:
			{
				point[0] += size_min[0];
				point[1] += size_max[1];
				point[2] += size_min[2];
			}
			case 6:
			{
				point[0] += size_max[0];
				point[1] += size_min[1];
				point[2] += size_min[2];
			}
			case 7:
			{
				point[0] += size_min[0];
				point[1] += size_min[1];
				point[2] += size_min[2];
			}
			case 8:		point[0] += size_max[0];
			case 9:		point[0] += size_min[0];
			case 10:	point[1] += size_max[1];
			case 11:	point[1] += size_min[1];
			case 12:	point[2] += size_max[2];
			case 13:	point[2] += size_min[2];
		}
 
		content = point_contents(point);
		if ( content == CONTENTS_EMPTY
		|| !content ) return false;
	}
 
	return true;
}
 
CreateTeleportAiming(id, teleport_type)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static origin[3];
	static Float:float_origin[3];
 
	get_user_origin(id, origin, 3);
	IVecFVec(origin, float_origin);
	float_origin[2] += 36.0;
 
	CreateTeleport(id, teleport_type, float_origin);
 
	return PLUGIN_HANDLED;
}
 
CreateTeleport(id, teleport_type, Float:origin[3])
{
	new ent = create_entity("info_target");
	if ( !is_valid_ent(ent) ) return PLUGIN_HANDLED;
 
	switch ( teleport_type )
	{
		case TELEPORT_START:
		{
			if ( g_teleport_start[id] ) remove_entity(g_teleport_start[id]);
 
			entity_set_string(ent, EV_SZ_classname, g_start_classname);
			entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
			entity_set_int(ent, EV_INT_movetype, MOVETYPE_NONE);
			entity_set_model(ent, g_sprite_teleport_start);
			entity_set_size(ent, Float:{ -16.0, -16.0, -16.0 }, Float:{ 16.0, 16.0, 16.0 });
			entity_set_origin(ent, origin);
 
			entity_set_int(ent, EV_INT_rendermode, 5);
			entity_set_float(ent, EV_FL_renderamt, 255.0);
 
			static params[2];
			params[0] = ent;
			params[1] = 6;
 
			set_task(0.1, "TaskSpriteNextFrame", TASK_SPRITE + ent, params, 2, g_b);
 
			g_teleport_start[id] = ent;
		}
		case TELEPORT_DESTINATION:
		{
			if ( !g_teleport_start[id] )
			{
				remove_entity(ent);
				return PLUGIN_HANDLED;
			}
 
			entity_set_string(ent, EV_SZ_classname, g_destination_classname);
			entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
			entity_set_int(ent, EV_INT_movetype, MOVETYPE_NONE);
			entity_set_model(ent, g_sprite_teleport_destination);
			entity_set_size(ent, Float:{ -16.0, -16.0, -16.0 }, Float:{ 16.0, 16.0, 16.0 });
			entity_set_origin(ent, origin);
 
			entity_set_int(ent, EV_INT_rendermode, 5);
			entity_set_float(ent, EV_FL_renderamt, 255.0);
 
			entity_set_int(ent, EV_INT_iuser1, g_teleport_start[id]);
			entity_set_int(g_teleport_start[id], EV_INT_iuser1, ent);
 
			static params[2];
			params[0] = ent;
			params[1] = 4;
 
			set_task(0.1, "TaskSpriteNextFrame", TASK_SPRITE + ent, params, 2, g_b);
 
			g_teleport_start[id] = 0;
		}
	}
 
	return PLUGIN_HANDLED;
}
 
DeleteTeleportAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body, 9999);
 
	new bool:deleted = DeleteTeleport(id, ent);
	if ( deleted ) BCM_Print(id, "Teleport deleted!");
 
	return PLUGIN_HANDLED;
}
 
bool:DeleteTeleport(id, ent)
{
	for ( new i = 0; i < 2; ++i )
	{
		if ( !IsTeleport(ent) ) return false;
 
		new tele = entity_get_int(ent, EV_INT_iuser1);
 
		if ( g_teleport_start[id] == ent
		|| g_teleport_start[id] == tele )
		{
			g_teleport_start[id] = 0;
		}
 
		if ( task_exists(TASK_SPRITE + ent) )
		{
			remove_task(TASK_SPRITE + ent);
		}
 
		if ( task_exists(TASK_SPRITE + tele) )
		{
			remove_task(TASK_SPRITE + tele);
		}
 
		if ( tele ) remove_entity(tele);
 
		remove_entity(ent);
		return true;
	}
 
	return false;
}
 
SwapTeleportAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body, 9999);
 
	if ( !IsTeleport(ent) ) return PLUGIN_HANDLED;
 
	SwapTeleport(id, ent);
 
	return PLUGIN_HANDLED;
}
 
SwapTeleport(id, ent)
{
	static Float:origin_ent[3];
	static Float:origin_tele[3];
 
	new tele = entity_get_int(ent, EV_INT_iuser1);
	if ( !is_valid_ent(tele) )
	{
		BCM_Print(id, "Can't swap teleport positions!");
		return PLUGIN_HANDLED;
	}
 
	entity_get_vector(ent, EV_VEC_origin, origin_ent);
	entity_get_vector(tele, EV_VEC_origin, origin_tele);
 
	static classname[32];
	entity_get_string(ent, EV_SZ_classname, classname, charsmax(classname));
 
	DeleteTeleport(id, ent);
 
	if ( equal(classname, g_start_classname) )
	{
		CreateTeleport(id, TELEPORT_START, origin_tele);
		CreateTeleport(id, TELEPORT_DESTINATION, origin_ent);
	}
	else if ( equal(classname, g_destination_classname) )
	{
		CreateTeleport(id, TELEPORT_START, origin_ent);
		CreateTeleport(id, TELEPORT_DESTINATION, origin_tele);
	}
 
	BCM_Print(id, "Teleports swapped!");
 
	return PLUGIN_HANDLED;
}
 
ShowTeleportPath(id)
{
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsTeleport(ent) ) return PLUGIN_HANDLED;
 
	new tele = entity_get_int(ent, EV_INT_iuser1);
	if ( !tele ) return PLUGIN_HANDLED;
 
	static Float:origin1[3], Float:origin2[3], Float:dist;
 
	entity_get_vector(ent, EV_VEC_origin, origin1);
	entity_get_vector(tele, EV_VEC_origin, origin2);
 
	message_begin(MSG_BROADCAST, SVC_TEMPENTITY);
	write_byte(TE_BEAMPOINTS);
	write_coord(floatround(origin1[0], floatround_floor));
	write_coord(floatround(origin1[1], floatround_floor));
	write_coord(floatround(origin1[2], floatround_floor));
	write_coord(floatround(origin2[0], floatround_floor));
	write_coord(floatround(origin2[1], floatround_floor));
	write_coord(floatround(origin2[2], floatround_floor));
	write_short(g_sprite_beam);
	write_byte(0);
	write_byte(1);
	write_byte(50);
	write_byte(5);
	write_byte(0);
	write_byte(255);
	write_byte(255);
	write_byte(255);
	write_byte(255);
	write_byte(0);
	message_end();
 
	dist = get_distance_f(origin1, origin2);
 
	BCM_Print(id, "A line has been drawn to show the teleport path. Distance:^1 %f units", dist);
 
	return PLUGIN_HANDLED;
}
 
bool:IsTeleport(ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	static classname[32];
	entity_get_string(ent, EV_SZ_classname, classname, charsmax(classname));
 
	if ( equal(classname, g_start_classname)
	|| equal(classname, g_destination_classname) )
	{
		return true;
	}
 
	return false;
}
 
CreateLightAiming(const id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static origin[3];
	static Float:float_origin[3];
 
	get_user_origin(id, origin, 3);
	IVecFVec(origin, float_origin);
	float_origin[2] += 4.0;
 
	CreateLight(float_origin, "25", "255", "255", "255");
 
	return PLUGIN_HANDLED;
}
 
CreateLight(Float:origin[3], const radius[], const color_red[], const color_green[], const color_blue[])
{
	new ent = create_entity("info_target");
	if ( !is_valid_ent(ent) ) return 0;
 
	entity_set_origin(ent, origin);
	entity_set_model(ent, g_sprite_light);
	entity_set_float(ent, EV_FL_scale, 0.25);
	entity_set_string(ent, EV_SZ_classname, g_light_classname);
	entity_set_int(ent, EV_INT_solid, SOLID_BBOX);
	entity_set_int(ent, EV_INT_movetype, MOVETYPE_NONE);
 
	entity_set_size(ent, Float:{ -3.0, -3.0, -6.0 }, Float:{ 3.0, 3.0, 6.0 });
 
	static Float:color[3];
	color[0] = str_to_float(color_red);
	color[1] = str_to_float(color_green);
	color[2] = str_to_float(color_blue);
 
	entity_set_vector(ent, EV_VEC_rendercolor, color);
 
	SetProperty(ent, 1, radius);
	SetProperty(ent, 2, color_red);
	SetProperty(ent, 3, color_green);
	SetProperty(ent, 4, color_blue);
 
	entity_set_float(ent, EV_FL_nextthink, get_gametime() + 0.01);
 
	return ent;
}
 
DeleteLightAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsLight(ent) ) return PLUGIN_HANDLED;
 
	new grabber = entity_get_int(ent, EV_INT_iuser2);
	if ( grabber && grabber != id ) return PLUGIN_HANDLED;
 
	DeleteLight(ent);
 
	return PLUGIN_HANDLED;
}
 
bool:DeleteLight(ent)
{
	if ( !IsLight(ent) ) return false;
 
	remove_entity(ent);
 
	return true;
}
 
SetPropertiesLightAiming(id)
{
	if ( !g_admin[id] && !g_gived_access[id] )
	{
		console_print(id, "Brak dostepu!");
		ShowLightMenu(id);
		return PLUGIN_HANDLED;
	}
 
	static ent, body;
	get_user_aiming(id, ent, body);
 
	if ( !IsLight(ent) )
	{
		ShowLightMenu(id);
		return PLUGIN_HANDLED;
	}
 
	g_viewing_light_properties_menu[id] = true;
	ShowLightPropertiesMenu(id, ent);
 
	return PLUGIN_HANDLED;
}
 
public SetPropertyLight(id)
{
	static arg[33];
	read_argv(1, arg, charsmax(arg));
 
	if ( !strlen(arg) )
	{
		BCM_Print(id, "You can't set a property blank! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetLightProperty");
		return PLUGIN_HANDLED;
	}
	else if ( !is_str_num(arg) )
	{
		BCM_Print(id, "You can't use letters in a property! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetLightProperty");
		return PLUGIN_HANDLED;
	}
 
	new ent = g_light_property_info[id][1];
	if ( !is_valid_ent(ent) )
	{
		BCM_Print(id, "That light has been deleted!");
		g_viewing_light_properties_menu[id] = false;
		ShowLightMenu(id);
		return PLUGIN_HANDLED;
	}
 
	static property;
	static property_value;
 
	property = g_light_property_info[id][0];
	property_value = str_to_num(arg);
 
	if ( property == 1 )
	{
		if ( !( 1 <= property_value <= 100 ) )
		{
			BCM_Print(id, "The property has to be between^1 1^3 and^1 100^3!");
			return PLUGIN_HANDLED;
		}
	}
	else if ( !( 0 <= property_value <= 255 ) )
	{
		BCM_Print(id, "The property has to be between^1 0^3 and^1 255^3!");
		return PLUGIN_HANDLED;
	}
 
	SetProperty(ent, property, arg);
 
	if ( property != 1 )
	{
		static color_red[5], color_green[5], color_blue[5];
 
		GetProperty(ent, 2, color_red);
		GetProperty(ent, 3, color_green);
		GetProperty(ent, 4, color_blue);
 
		static Float:color[3];
		color[0] = str_to_float(color_red);
		color[1] = str_to_float(color_green);
		color[2] = str_to_float(color_blue);
 
		entity_set_vector(ent, EV_VEC_rendercolor, color);
	}
 
	for ( new i = 1; i <= g_max_players; i++ )
	{
		if ( !g_connected[i]
		|| !g_viewing_light_properties_menu[i] ) continue;
 
		ent = g_light_property_info[i][1];
		ShowLightPropertiesMenu(i, ent);
	}
 
	return PLUGIN_HANDLED;
}
 
public THINK_BLOCK(ent)
{
	if(is_valid_ent(ent))
	{
		new Float:fLen = vector_length(fVelo[ent]);
 
		if(fLen >= 24.5)
		{
			set_pev(ent, pev_velocity, fVelo[ent]);
 
			new Float:fOri[3];
			entity_get_vector(ent, EV_VEC_origin, fOri);
 
			for(new i = 0 ; i < 3 ; i ++){
				if(fVelo[ent][i]){
					if((fOri[i] - 5.5) > (g_fOrigin[ent][i] + g_iFlyDistance[ent]) && fVelo[ent][i] >= 0.0 || (fOri[i] + 5.5) < g_fOrigin[ent][i] && fVelo[ent][i] < 0.0){
						fVelo[ent][i] *=  -1.0;
					}
				}
			}
 
			new iPlayers[32], iNum;
			get_players(iPlayers, iNum);
 
			for(new i = 0 ; i < iNum ; i ++){
				new iFlags = pev(iPlayers[i], pev_flags);
 
				if(fVelo[ent][2] >= 24.5){
					if((iFlags & FL_ONGROUND) && pev(iPlayers[i], pev_groundentity) == ent)
					{
						new Float:fOrigin[3];
						entity_get_vector(iPlayers[i], EV_VEC_origin, fOrigin);
 
						//new hull = pev(iPlayers[i], pev_flags) & FL_DUCKING ? HULL_HEAD : HULL_HUMAN;
						fOrigin[2] += 1.0;
						entity_set_vector(iPlayers[i], EV_VEC_origin, fOrigin);
 
					}
				}
			}
		}
		set_pev(ent, pev_nextthink, get_gametime() + 0.02);
	}
}
 
public LightThink(ent)
{
	static radius[5], color_red[5], color_green[5], color_blue[5];
 
	GetProperty(ent, 1, radius);
	GetProperty(ent, 2, color_red);
	GetProperty(ent, 3, color_green);
	GetProperty(ent, 4, color_blue);
 
	static Float:float_origin[3];
	entity_get_vector(ent, EV_VEC_origin, float_origin);
 
	static origin[3];
	FVecIVec(float_origin, origin);
 
	message_begin(MSG_PVS, SVC_TEMPENTITY, origin, 0);
	write_byte(TE_DLIGHT);
	write_coord(origin[0]);
	write_coord(origin[1]);
	write_coord(origin[2]);
	write_byte(str_to_num(radius));
	write_byte(str_to_num(color_red));
	write_byte(str_to_num(color_green));
	write_byte(str_to_num(color_blue));
	write_byte(1);
	write_byte(1);
	message_end();
 
	entity_set_float(ent, EV_FL_nextthink, get_gametime() + 0.01);
}
 
bool:IsLight(ent)
{
	if ( !is_valid_ent(ent) ) return false;
 
	static classname[32];
	entity_get_string(ent, EV_SZ_classname, classname, charsmax(classname));
 
	if ( equal(classname, g_light_classname) )
	{
		return true;
	}
 
	return false;
}
 
DoSnapping(id, ent, Float:move_to[3])
{
	if ( !g_snapping[id] ) return PLUGIN_HANDLED;
 
	new traceline;
	new closest_trace;
	new block_face;
	new Float:snap_size;
	new Float:v_return[3];
	new Float:dist;
	new Float:old_dist;
	new Float:trace_start[3];
	new Float:trace_end[3];
	new Float:size_min[3];
	new Float:size_max[3];
 
	entity_get_vector(ent, EV_VEC_mins, size_min);
	entity_get_vector(ent, EV_VEC_maxs, size_max);
 
	snap_size = g_snapping_gap[id] + 10.0;
	old_dist = 9999.9;
	closest_trace = 0;
	for ( new i = 0; i < 6; ++i )
	{
		trace_start = move_to;
 
		switch ( i )
		{
			case 0: trace_start[0] += size_min[0];
			case 1: trace_start[0] += size_max[0];
			case 2: trace_start[1] += size_min[1];
			case 3: trace_start[1] += size_max[1];
			case 4: trace_start[2] += size_min[2];
			case 5: trace_start[2] += size_max[2];
		}
 
		trace_end = trace_start;
 
		switch ( i )
		{
			case 0: trace_end[0] -= snap_size;
			case 1: trace_end[0] += snap_size;
			case 2: trace_end[1] -= snap_size;
			case 3: trace_end[1] += snap_size;
			case 4: trace_end[2] -= snap_size;
			case 5: trace_end[2] += snap_size;
		}
 
		traceline = trace_line(ent, trace_start, trace_end, v_return);
		if ( IsBlock(traceline)
		&& ( !IsBlockInGroup(id, traceline) || !IsBlockInGroup(id, ent) ) )
		{
			dist = get_distance_f(trace_start, v_return);
			if ( dist < old_dist )
			{
				closest_trace = traceline;
				old_dist = dist;
 
				block_face = i;
			}
		}
	}
 
	if ( !is_valid_ent(closest_trace) ) return PLUGIN_HANDLED;
 
	static Float:trace_origin[3];
	static Float:trace_size_min[3];
	static Float:trace_size_max[3];
 
	entity_get_vector(closest_trace, EV_VEC_origin, trace_origin);
	entity_get_vector(closest_trace, EV_VEC_mins, trace_size_min);
	entity_get_vector(closest_trace, EV_VEC_maxs, trace_size_max);
 
	move_to = trace_origin;
 
	if ( block_face == 0 ) move_to[0] += ( trace_size_max[0] + size_max[0] ) + g_snapping_gap[id];
	if ( block_face == 1 ) move_to[0] += ( trace_size_min[0] + size_min[0] ) - g_snapping_gap[id];
	if ( block_face == 2 ) move_to[1] += ( trace_size_max[1] + size_max[1] ) + g_snapping_gap[id];
	if ( block_face == 3 ) move_to[1] += ( trace_size_min[1] + size_min[1] ) - g_snapping_gap[id];
	if ( block_face == 4 ) move_to[2] += ( trace_size_max[2] + size_max[2] ) + g_snapping_gap[id];
	if ( block_face == 5 ) move_to[2] += ( trace_size_min[2] + size_min[2] ) - g_snapping_gap[id];
 
	return PLUGIN_HANDLED;
}
 
DeleteAll(id, bool:notify)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	static ent, block_count, tele_count, light_count, bool:deleted;
 
	ent = -1;
	block_count = 0;
	while ( ( ent = find_ent_by_class(ent, g_block_classname) ) )
	{
		deleted = DeleteBlock(ent);
		if ( deleted )
		{
			++block_count;
		}
	}
 
	ent = -1;
	tele_count = 0;
	while ( ( ent = find_ent_by_class(ent, g_start_classname) ) )
	{
		deleted = DeleteTeleport(id, ent);
		if ( deleted )
		{
			++tele_count;
		}
	}
 
	ent = -1;
	light_count = 0;
	while ( ( ent = find_ent_by_class(ent, g_light_classname) ) )
	{
		deleted = DeleteLight(ent);
		if ( deleted )
		{
			++light_count;
		}
	}
 
	if ( ( block_count
	|| tele_count
	|| light_count )
	&& notify )
	{
		static name[32];
		get_user_name(id, name, charsmax(name));
 
		for ( new i = 1; i <= g_max_players; ++i )
		{
			g_grabbed[i] = 0;
			g_teleport_start[i] = 0;
 
			if ( !g_connected[i]
			|| !g_admin[i] && !g_gived_access[i] ) continue;
 
			BCM_Print(i, "^1%s^3 deleted^1 %d blocks^3,^1 %d teleports^3 and^1 %d lights^3 from the map!", name, block_count, tele_count, light_count);
		}
	}
 
	return PLUGIN_HANDLED;
}
 
SaveBlocks(id)
{
	if ( !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
 
	new ent;
	new file;
	new data[256];
	new block_count;
	new tele_count;
	new light_count;
	new block_type;
	new size;
	new property1[13], property2[5], property3[5], property4[5];
	new tele;
	new Float:origin[3];
	new Float:angles[3];
	new Float:tele_start[3];
	new Float:tele_end[3];
	new Float:max_size;
	new Float:size_max[3];
	new Float:RGB[3], Float:RenderAmt, RenderFX, RenderMode;
	file = fopen(g_file, "wt");
	block_count = 0;
	tele_count = 0;
 
	ent = -1;
	while ( ( ent = find_ent_by_class(ent, g_block_classname) ) )
	{
		block_type = entity_get_int(ent, EV_INT_body);
		entity_get_vector(ent, EV_VEC_origin, origin);
		entity_get_vector(ent, EV_VEC_angles, angles);
		entity_get_vector(ent, EV_VEC_maxs, size_max);
 
		//rendering
		if(task_exists(ent + TASK_SOLID))
		{		
			RenderMode = pev(ent, pev_euser2);
			RenderFX = pev(ent, pev_euser1);
			pev( ent, pev_speed, RenderAmt );
			pev( ent, pev_oldorigin, RGB );
		}
		else
		{
			RenderMode = entity_get_int(ent, EV_INT_rendermode);
			RenderFX = entity_get_int(ent, EV_INT_renderfx);
			pev( ent, pev_renderamt, RenderAmt );
			pev( ent, pev_rendercolor, RGB );
		}
 
		GetProperty(ent, 1, property1);
		GetProperty(ent, 2, property2);
		GetProperty(ent, 3, property3);
		GetProperty(ent, 4, property4);
 
		if ( !property1[0] ) copy(property1, charsmax(property1), "/");
		if ( !property2[0] ) copy(property2, charsmax(property2), "/");
		if ( !property3[0] ) copy(property3, charsmax(property3), "/");
		if ( !property4[0] ) copy(property4, charsmax(property4), "/");
 
		max_size = size_max[0] + size_max[1] + size_max[2];
 
		if ( max_size > 128.0 )		size = LARGE;
		else if ( max_size > 64.0 )	size = NORMAL;
		else if ( max_size > 32.0 )	size = POLE;
		else				size = TINY;
 
		formatex(data, charsmax(data), "%c %f %f %f %f %f %f %d %s %s %s %s %f %f %f %f %d %d %f %f %f %f %f %f %d^n",\
		g_block_save_ids[block_type], origin[0], origin[1], origin[2], angles[0],angles[1],angles[2],size,property1,property2,property3,	property4,
		RGB[0],RGB[1],RGB[2],RenderAmt,RenderFX,RenderMode,g_fOrigin[ent][0],g_fOrigin[ent][1],g_fOrigin[ent][2],fVelo[ent][0] >= 0.0 ? fVelo[ent][0] : fVelo[ent][0] * -1.0,
		fVelo[ent][1] >= 0.0 ? fVelo[ent][1] : fVelo[ent][1] * -1.0, fVelo[ent][2] >= 0.0 ? fVelo[ent][2] : fVelo[ent][2] * -1.0, g_iFlyDistance[ent]);
		fputs(file, data);
 
		++block_count;
	}
 
	ent = -1;
	while ( ( ent = find_ent_by_class(ent, g_destination_classname) ) )
	{
		tele = entity_get_int(ent, EV_INT_iuser1);
		if ( tele )
		{
			entity_get_vector(tele, EV_VEC_origin, tele_start);
			entity_get_vector(ent, EV_VEC_origin, tele_end);
 
			formatex(data, charsmax(data), "* %f %f %f %f %f %f^n",\
			tele_start[0],\
			tele_start[1],\
			tele_start[2],\
			tele_end[0],\
			tele_end[1],\
			tele_end[2]
			);
			fputs(file, data);
 
			++tele_count;
		}
	}
 
	ent = -1;
	while ( ( ent = find_ent_by_class(ent, g_light_classname) ) )
	{
		entity_get_vector(ent, EV_VEC_origin, origin);
 
		GetProperty(ent, 1, property1);
		GetProperty(ent, 2, property2);
		GetProperty(ent, 3, property3);
		GetProperty(ent, 4, property4);
 
		formatex(data, charsmax(data), "! %f %f %f / / / / %s %s %s %s^n",\
		origin[0],\
		origin[1],\
		origin[2],\
		property1,\
		property2,\
		property3,\
		property4
		);
		fputs(file, data);
 
		++light_count;
	}
 
	static name[32];
	get_user_name(id, name, charsmax(name));
 
	for ( new i = 1; i <= g_max_players; ++i )
	{
		if ( g_connected[i]
		&& ( g_admin[i] || g_gived_access[i] ) )
		{
			BCM_Print(i, "^1%s^3 zapisal^1 %d blokow%s^3,^1 %d teleportow%s^3 i^1 %d swiatel%s^3! Wszystkich blokow na mapie:^1 %d", name, block_count, block_count == 1 ? g_blank : "s", tele_count, tele_count == 1 ? g_blank : "s", light_count, light_count == 1 ? g_blank : "s", entity_count());
		}
	}
 
	fclose(file);
	return PLUGIN_HANDLED;
}
 
LoadBlocks(id)
{
	if ( id != 0 && !g_admin[id] )
	{
		console_print(id, "Brak dostepu!");
		return PLUGIN_HANDLED;
	}
	else if ( !file_exists(g_file)
	&& 1 <= id <= g_max_players )
	{
		BCM_Print(id, "Couldn't find file:^1 %s", g_file);
		return PLUGIN_HANDLED;
	}
 
	if ( 1 <= id <= g_max_players )
	{
		DeleteAll(id, false);
	}
 
	new file;
	new data[256];
	new block_count;
	new tele_count;
	new light_count;
	new type[2];
	new block_size[17];
	new origin_x[17];
	new origin_y[17];
	new origin_z[17];
	new angel_x[17];
	new angel_y[17];
	new angel_z[17];
	new block_type;
	new axis;
	new size;
	new property1[13], property2[5], property3[5], property4[5];
	new Float:origin[3];
	new Float:angles[3];
	new CreatedEnt;
	//rendering
	new szRGB[3][17], szRenderFX[17], szRenderMode[17], szRenderAmt[17];
	new Float:RGB[3], Float:RenderAmt, RenderFX, RenderMode;
	new sOri[3][15], sVelo[3][15], sDist[5];
 
	file = fopen(g_file, "rt");
 
	block_count = 0;
	tele_count = 0;
 
	while ( !feof(file) )
	{
		type = g_blank;
 
		fgets(file, data, charsmax(data));
		parse(data, type, charsmax(type), origin_x, charsmax(origin_x), origin_y, charsmax(origin_y), origin_z, charsmax(origin_z), angel_x, charsmax(angel_x), angel_y, charsmax(angel_y), angel_z, charsmax(angel_z),
		block_size, charsmax(block_size), property1, charsmax(property1), property2, charsmax(property2), property3, charsmax(property3), property4, charsmax(property4), szRGB[0], 16,szRGB[1], 16, szRGB[2], 16,
		szRenderAmt, 16, szRenderFX, 16, szRenderMode, 16, sOri[0], 14, sOri[1], 14, sOri[2], 14, sVelo[0], 14, sVelo[1], 14, sVelo[2], 14, sDist, 14);
 
		origin[0] =	str_to_float(origin_x);
		origin[1] =	str_to_float(origin_y);
		origin[2] =	str_to_float(origin_z);
		angles[0] =	str_to_float(angel_x);
		angles[1] =	str_to_float(angel_y);
		angles[2] =	str_to_float(angel_z);
		size =		str_to_num(block_size);
		RGB[0] = str_to_float(szRGB[0]);
		RGB[1] = str_to_float(szRGB[1]);
		RGB[2] = str_to_float(szRGB[2]);
		RenderAmt = str_to_float(szRenderAmt);
		RenderFX = str_to_num(szRenderFX);
		RenderMode = str_to_num(szRenderMode);
 
		if ( strlen(type) > 0 )
		{
			if ( type[0] != '*' )
			{
				if ( angles[0] == 90.0 && angles[1] == 0.0 && angles[2] == 0.0 )
				{
					axis = X;
				}
				else if ( angles[0] == 90.0 && angles[1] == 0.0 && angles[2] == 90.0 )
				{
					axis = Y;
				}
				else
				{
					axis = Z;
				}
			}
 
			switch ( type[0] )
			{
				case 'A': block_type = PLATFORM;
				case 'B': block_type = BUNNYHOP;
				case 'C': block_type = DAMAGE;
				case 'D': block_type = HEALER;
				case 'E': block_type = NO_FALL_DAMAGE;
				case 'F': block_type = ICE;
				case 'G': block_type = TRAMPOLINE;
				case 'H': block_type = SPEED_BOOST;
				case 'I': block_type = DEATH;
				case 'L': block_type = HONEY;
				case 'M': block_type = CT_BARRIER;
				case 'N': block_type = T_BARRIER;
				case 'O': block_type = GLASS;
				case 'P': block_type = NO_SLOW_DOWN_BUNNYHOP;
				case 'Q': block_type = DELAYED_BUNNYHOP;
				case 'R': block_type = INVINCIBILITY;
				case 'S': block_type = STEALTH;
				case 'T': block_type = BOOTS_OF_SPEED;
				case 'U': block_type = KAMUFLAZ;
				case 'Y': block_type = BRON;
				case '1': block_type = ARMOR;
				case '2': block_type = SPAMDUCK;
				case '3': block_type = GRANATY;
				case '4': block_type = VIP;
				case '6': block_type = OSLEPIENIE;
				case '7': block_type = TRZESIENIE;
				case '5': block_type = TRAWA;
				case '8': block_type = MELANZ;
				case '9': block_type = DREWNO;
				case '%': block_type = EXP;
				case '#': block_type = MUZA;
				case 'a': block_type = BHDAMAGE;
				case 'b': block_type = BHICE;
				case 'c': block_type = HE;
				case 'd': block_type = SG;
				case 'e': block_type = FLASH;
				case 'f': block_type = CARPET;
				case 'g': block_type = LUKE;
 
				case '*':
				{
					CreateTeleport(0, TELEPORT_START, origin);
					CreateTeleport(0, TELEPORT_DESTINATION, angles);
 
					++tele_count;
				}
				case '!':
				{
					CreateLight(origin, property1, property2, property3, property4);
 
					++light_count;
				}
			}
 
			if ( type[0] != '*' && type[0] != '!' )
			{
				CreatedEnt = CreateBlock(0, block_type, origin, axis, size, property1, property2, property3, property4);
				set_pev(CreatedEnt, pev_renderfx, RenderFX);
				set_pev(CreatedEnt, pev_rendermode, RenderMode);
				set_pev(CreatedEnt, pev_rendercolor, RGB);
				set_pev(CreatedEnt, pev_renderamt, RenderAmt);
				g_fOrigin[CreatedEnt][0] = str_to_float(sOri[0]);
				g_fOrigin[CreatedEnt][1] = str_to_float(sOri[1]);
				g_fOrigin[CreatedEnt][2] = str_to_float(sOri[2]);
				fVelo[CreatedEnt][0] = str_to_float(sVelo[0]);
				fVelo[CreatedEnt][1] = str_to_float(sVelo[1]);
				fVelo[CreatedEnt][2] = str_to_float(sVelo[2]);
				g_iFlyDistance[CreatedEnt] = str_to_num(sDist);
 
				if(g_iFlyDistance[CreatedEnt]){
					set_pev(CreatedEnt, pev_movetype, MOVETYPE_FLY);
					set_pev(CreatedEnt, pev_nextthink,  get_gametime() + 5.0);
				}
 
				++block_count;
			}
		}
	}
 
	fclose(file);
 
	if ( 1 <= id <= g_max_players )
	{
		static name[32];
		get_user_name(id, name, charsmax(name));
 
		for ( new i = 1; i <= g_max_players; ++i )
		{
			if ( !g_connected[i]
			|| !g_admin[i] && !g_gived_access[i] ) continue;
 
			BCM_Print(i, "^1%s^3 loaded^1 %d block%s^3,^1 %d teleport%s^3 and^1 %d light%s^3! Total entites in map:^1 %d", name, block_count, block_count == 1 ? g_blank : "s", tele_count, tele_count == 1 ? g_blank : "s", light_count, light_count == 1 ? g_blank : "s", entity_count());
		}
	}
 
	return PLUGIN_HANDLED;
}
 
bool:IsStrFloat(string[])
{
	new len = strlen(string);
	for ( new i = 0; i < len; i++ )
	{
		switch ( string[i] )
		{
			case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-':	continue;
			default:							return false;
		}
	}
 
	return true;
}
 
ResetPlayer(id)
{
	g_melanz[id] = 			false;
	g_no_fall_damage[id] =		false;
	g_ice[id] =			false;
	g_no_slow_down[id] =		false;
	g_block_status[id] =		false;
	g_has_hud_text[id] =		false;
	UzylGranaty[id] = 		0;
	UsedNade[id][0] =		0;
	UsedNade[id][1] =		0;
	UsedNade[id][2] =		0;
 
	g_luke[id] = 0;
 
	g_honey[id] =			0;
	g_boots_of_speed[id] =		0;
 
	g_next_damage_time[id] =	0.0;
	g_next_heal_time[id] =		0.0;
	g_next_armor_time[id] =		0.0;
	g_invincibility_time_out[id] =	0.0;
	g_invincibility_next_use[id] =	0.0;
	g_stealth_time_out[id] =	0.0;
	g_stealth_next_use[id] =	0.0;
	g_kamuflaz_time_out[id] =	0.0;
	g_kamuflaz_next_use[id] =	0.0;
	g_boots_of_speed_time_out[id] =	0.0;
	g_boots_of_speed_next_use[id] =	0.0;
	g_melanz_time_out[id] = 	0.0;
	g_melanz_next_use[id] =		0.0;
	g_luke_next_use[id] =		0.0;
	KasaUsed[id] = false;
 
	new task_id = TASK_INVINCIBLE + id;
	if ( task_exists(task_id) )
	{
		TaskRemoveInvincibility(task_id);
		remove_task(task_id);
	}
 
	task_id = TASK_STEALTH + id;
	if ( task_exists(task_id) )
	{
		TaskRemoveStealth(task_id);
		remove_task(task_id);
	}
 
	task_id = TASK_BOOTSOFSPEED + id;
	if ( task_exists(task_id) )
	{
		TaskRemoveBootsOfSpeed(task_id);
		remove_task(task_id);
	}
	task_id = TASK_KAMUFLAZ + id;
	if ( task_exists(task_id) )
	{
		//TaskRemoveBootsOfSpeed(task_id);
		remove_task(task_id);
		//Zmiana modelu na poprzedni
		cs_set_user_model(id, gszCamouflageOldModel[id]);
	}
	for(new k = 0;k<27;k++)
	{
		BronUsed[k][id] = false;
	}
	/*for(new g = 0;g<1024;g++)
	{
		ExpUsed[g][id] = false;
	}*/
	if ( g_connected[id] )
	{
		set_user_rendering(id, kRenderFxGlowShell, 0, 0, 0, kRenderNormal, 255);
	}
 
	g_reseted[id] =			true;
}
 
ResetMaxspeed(id)
{
	static Float:max_speed;
	switch ( get_user_weapon(id) )
	{
		case CSW_SG550, CSW_AWP, CSW_G3SG1:		max_speed = 210.0;
		case CSW_M249:					max_speed = 220.0;
		case CSW_AK47:					max_speed = 221.0;
		case CSW_M3, CSW_M4A1:				max_speed = 230.0;
		case CSW_SG552:					max_speed = 235.0;
		case CSW_XM1014, CSW_AUG, CSW_GALIL, CSW_FAMAS:	max_speed = 240.0;
		case CSW_P90:					max_speed = 245.0;
		case CSW_SCOUT:					max_speed = 260.0;
		default:					max_speed = 250.0;
	}
 
	entity_set_float(id, EV_FL_maxspeed, max_speed);
}
 
BCM_Print(id, const message_fmt[], any:...)
{
	static i; i = id ? id : GetPlayer();
	if ( !i ) return;
 
	static message[256], len;
	len = formatex(message, charsmax(message), "^4[%s]^3 ", PLUGIN_PREFIX);
	vformat(message[len], charsmax(message) - len, message_fmt, 3);
	message[192] = 0;
 
	static msgid_SayText;
	if ( !msgid_SayText ) msgid_SayText = get_user_msgid("SayText");
 
	static const team_names[][] =
	{
		"",
		"TERRORIST",
		"CT",
		"SPECTATOR"
	};
 
	static team; team = get_user_team(i);
 
	TeamInfo(i, id, team_names[0]);
 
	message_begin(id ? MSG_ONE_UNRELIABLE : MSG_BROADCAST, msgid_SayText, _, id);
	write_byte(i);
	write_string(message);
	message_end();
 
	TeamInfo(i, id, team_names[team]);
}
 
TeamInfo(receiver, sender, team[])
{
	static msgid_TeamInfo;
	if ( !msgid_TeamInfo ) msgid_TeamInfo = get_user_msgid("TeamInfo");
 
	message_begin(sender ? MSG_ONE_UNRELIABLE : MSG_BROADCAST, msgid_TeamInfo, _, sender);
	write_byte(receiver);
	write_string(team);
	message_end();
}
 
GetPlayer()
{
	for ( new id = 1; id <= g_max_players; id++ )
	{
		if ( !g_connected[id] ) continue;
 
		return id;
	}
 
	return 0;
}
public taskCamouflageRemove(id)
{
	id -= TASK_KAMUFLAZ;
 
	//if player is still connected
	if (is_user_connected(id))
	{
		//change back to players old model
		cs_set_user_model(id, gszCamouflageOldModel[id]);
	}
}
public SetRenderingBlock(id)
{
	static arg[5];
	read_argv(1, arg, charsmax(arg));
 
	if ( !strlen(arg) )
	{
		BCM_Print(id, "You can't set a property blank! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetProperty");
		return PLUGIN_HANDLED;
	}
	else if ( !IsStrFloat(arg) )
	{
		BCM_Print(id, "You can't use letters in a property! Please type a new value.");
		client_cmd(id, "messagemode BCM_SetProperty");
		return PLUGIN_HANDLED;
	}
	new check = str_to_num(arg);
	if(check < 0 || check > 255)
	{
		BCM_Print(id, "Mozesz wpisac cyfre od 0 do 255!");
		client_cmd(id, "messagemode BCM_SetProperty");
		return PLUGIN_HANDLED;
	}
 
	if(gRenderInfo[id] == 1)
		Przezroczystosc[id] = str_to_num(arg);
	if(gRenderInfo[id] == 2)
		Czerwony[id] = str_to_num(arg);
	if(gRenderInfo[id] == 3)
		Zielony[id] = str_to_num(arg);
	if(gRenderInfo[id] == 4)
		Niebieski[id] = str_to_num(arg);
 
	ShowRenderMenu(id);
	return PLUGIN_CONTINUE;
}
stock fm_give_item(index, const item[]) 
{
	if (!equal(item, "weapon_", 7) && !equal(item, "ammo_", 5) && !equal(item, "item_", 5) && !equal(item, "tf_weapon_", 10))
		return 0;
 
	new ent = fm_create_entity(item);
	if (!pev_valid(ent))
		return 0;
 
	new Float:origin[3];
	pev(index, pev_origin, origin);
	set_pev(ent, pev_origin, origin);
	set_pev(ent, pev_spawnflags, pev(ent, pev_spawnflags) | SF_NORESPAWN);
	dllfunc(DLLFunc_Spawn, ent);
 
	new save = pev(ent, pev_solid);
	dllfunc(DLLFunc_Touch, ent, index);
	if (pev(ent, pev_solid) != save)
		return ent;
 
	engfunc(EngFunc_RemoveEntity, ent);
 
	return -1;
}
 
stock fm_create_entity(const classname[])
	return engfunc(EngFunc_CreateNamedEntity, engfunc(EngFunc_AllocString, classname));
 
 
