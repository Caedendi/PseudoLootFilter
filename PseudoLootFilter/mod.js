///////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Constants //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const CONFIG_ITEM_TYPE_ARMOR  = "Armors";
const CONFIG_ITEM_TYPE_WEAPON = "Weapons";

const CONFIG_ITEM_QUALITY_UNIQUE = "UNIQUE";
const CONFIG_ITEM_QUALITY_SET    = "SET";

const REMOVE_NO_ELEMENTS = 0;

const TC_INDEX_AFTER_GOLD = 1;

const RARITY1 = 1;
const RARITY2 = 2;
const RARITY3 = 3;

const TC_MIN       =  3;
const TC_MAX       = 87;
const TC_SIZE      =  3;
const TC_MAX_ITEMS = 10;

const ITEM_TYPE_ARMOR              = "ARMOR";
const ITEM_TYPE_WEAPON             = "WEAPON";
const ITEM_SUB_TYPE_WEAPON_MELEE   = "mele";
const ITEM_SUB_TYPE_WEAPON_MISSILE = "miss";
const NO_WEAPON_SUB_TYPE           = "NO_WEAPON_SUBTYPE";
const NO_ITEM_SUB_TYPE             = "";

const TC_NAME_ARMOR_PREFIX          = "armo";
const TC_NAME_WEAPON_PREFIX         = "weap";
const TC_NAME_WEAPON_MELEE_PREFIX   = "mele";
const TC_NAME_WEAPON_MISSILE_PREFIX = "bow";
const TC_NAME_SUFFIX                = "new";
const TC_NAME_RARIRY_SUFFIX         = "R";
const TC_NAME_PART_SUFFIX           = "P";

const TC_ITEM_COLUMN_PREFIX        = "Item";
const TC_PROBABILITY_COLUMN_PREFIX = "Prob";

const TC_NAME_COLUMN    = "Treasure Class";
const TC_NO_DROP_COLUMN = "NoDrop";

const ITEM_NAME_COLUMN  = "name";
const ITEM_CODE_COLUMN  = "code";
const ITEM_LEVEL_COLUMN = "level";
const ITEM_TYPE_COLUMN  = "type";

const ITEM_TYPES_SUB_TYPE_COLUMN = "Equiv1";

const TREASURE_CLASS_EX_FILENAME = 'global\\excel\\treasureClassEx.txt';
const WEAPONS_FILENAME           = 'global\\excel\\weapons.txt';
const ARMOR_FILENAME             = 'global\\excel\\armor.txt';
const ITEM_TYPES_FILENAME        = 'global\\excel\\itemtypes.txt';
const MISC_FILENAME              = 'global\\excel\\misc.txt';
const UNIQUE_ITEMS_FILENAME      = 'global\\excel\\uniqueitems.txt';
const SET_ITEMS_FILENAME         = 'global\\excel\\setitems.txt';
const ITEM_NAMES_FILENAME        = 'local\\lng\\strings\\item-names.json';

const TREASURE_CLASS_EX_FILE = D2RMM.readTsv(TREASURE_CLASS_EX_FILENAME);
const ITEM_TYPES_FILE        = D2RMM.readTsv(ITEM_TYPES_FILENAME);
const WEAPONS_FILE           = D2RMM.readTsv(WEAPONS_FILENAME);
const ARMOR_FILE             = D2RMM.readTsv(ARMOR_FILENAME);
const MISC_FILE              = D2RMM.readTsv(MISC_FILENAME);
const UNIQUE_ITEMS_FILE      = D2RMM.readTsv(UNIQUE_ITEMS_FILENAME);
const SET_ITEMS_FILE         = D2RMM.readTsv(SET_ITEMS_FILENAME);
const ITEM_NAMES_FILE        = D2RMM.readJson(ITEM_NAMES_FILENAME);

const LOG_ENABLED = false;
let logIndex = 1;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Main ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

handleGems();
handleRunes();
handleMiscItems();
handleItems(ITEM_TYPE_ARMOR);
handleItems(ITEM_TYPE_WEAPON);
handleItems(ITEM_TYPE_WEAPON, ITEM_SUB_TYPE_WEAPON_MELEE);
handleItems(ITEM_TYPE_WEAPON, ITEM_SUB_TYPE_WEAPON_MISSILE);

D2RMM.writeTsv(TREASURE_CLASS_EX_FILENAME, TREASURE_CLASS_EX_FILE);

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Gems Functions ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function handleGems() {
	const gemTreasureClasses = TREASURE_CLASS_EX_FILE.rows.filter((row) => isGemTc(row));

	ITEM_TYPES_FILE.rows
		.filter((currItemTypeRow) => isGemQualityItemType(currItemTypeRow))
		.forEach(currItemTypeRow => {
			if (config[currItemTypeRow.Code] === true) {
				gemTreasureClasses.forEach(row => {
					updateTreasureClassRowToFullNoDrop(row);
				});
			}
		});
}

function isGemTc(treasureClassRow) {
	const treasureClassName = treasureClassRow[TC_NAME_COLUMN];
	return treasureClassName.match(/^(Chipped|Flawed|Normal|Flawless) Gem$/) != null;
}

function isGemQualityItemType(itemType) {
	return itemType.Code.match(/gem(0|1|2|3)/) != null;
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Runes Functions //////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function handleRunes() {
	const runeTreasureClasses = TREASURE_CLASS_EX_FILE.rows.filter((row) => isRuneTc(row));

	MISC_FILE.rows
		.filter(row => isRuneItemType(row))
		.forEach(row => {
			if (config[row.code] === true) {
				runeTreasureClasses.forEach(row => {
					updateTreasureClassRowItemToNoDrop(row, row.code);
				});
			}
		});
}

function isRuneTc(treasureClassRow) {
	return treasureClassRow[TC_NAME_COLUMN].match(/^Runes /) != null;
}

function isRuneItemType(item) {
	return item.type === "rune";
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////// Misc Items Functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function handleMiscItems() {
	MISC_FILE.rows
		.filter(row => isMiscItemType(row))
		.forEach(row => {
			if (config[row.code] === true) {
				TREASURE_CLASS_EX_FILE.rows.forEach(row => {
					updateTreasureClassRowItemToNoDrop(row, row.code);
				});
			}
		});

	WEAPONS_FILE.rows
		.filter((currWeaponRow) => isMiscWeaponType(currWeaponRow))
		.forEach(currWeaponRow => {
			if (config[currWeaponRow.code] === true) {
				TREASURE_CLASS_EX_FILE.rows.forEach(row => {
					updateTreasureClassRowItemToNoDrop(row, currWeaponRow.code);
				});
			}
		});

	if (config.gld) {
		TREASURE_CLASS_EX_FILE.rows
			.forEach(row => {
				updateTreasureClassRowItemToNoDrop(row, "gld");
			});
	}
}

function isMiscItemType(item) {
	return item.type.match(/(hpot|mpot|rpot|spot|apot|wpot|bowq|xboq|scro|key)/) != null;
}

function isMiscWeaponType(item) {
	return item.type.match(/tpot/) != null;
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Item Functions ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function handleItems(itemType, itemSubType) {
	if (itemSubType === undefined) {
		itemSubType = NO_ITEM_SUB_TYPE;
	}

	for (let currTcNumber = TC_MIN; currTcNumber <= TC_MAX; currTcNumber += TC_SIZE) {
		const tcNamePrefix = getTcNamePrefix(itemType, itemSubType);
		const items = getItems(itemType, currTcNumber);

		const itemsRarity1 = items.filter(item => (+item.typeRarity) === RARITY1 && (itemSubType === NO_ITEM_SUB_TYPE || item.subType === itemSubType));
		const itemsRarity2 = items.filter(item => (+item.typeRarity) === RARITY2 && (itemSubType === NO_ITEM_SUB_TYPE || item.subType === itemSubType));
		const itemsRarity3 = items.filter(item => (+item.typeRarity) === RARITY3 && (itemSubType === NO_ITEM_SUB_TYPE || item.subType === itemSubType));

		if (itemsRarity1.length + itemsRarity2.length + itemsRarity3.length === 0) {
			if (isEmptyTc(itemType, itemSubType, currTcNumber)) {
				continue;
			}
			throw "No items with type rarity 1,2 or 3 found for itemType = " + itemType + "; itemSubType = " + itemSubType + "; tc " + currTcNumber + "!";
		}

		const rarity1TCs = generateTcRows(itemsRarity1, currTcNumber, tcNamePrefix, RARITY1);
		const rarity2TCs = generateTcRows(itemsRarity2, currTcNumber, tcNamePrefix, RARITY2);
		const rarity3TCs = generateTcRows(itemsRarity3, currTcNumber, tcNamePrefix, RARITY3);

		const currTcName = tcNamePrefix + addTreasureClassPadding(currTcNumber) + TC_NAME_SUFFIX;

		const currTc = {
			[TC_NAME_COLUMN]: currTcName,
			level: currTcNumber,
			Picks: 1,
			NoDrop: 0,
		};

		let index = 1;

		if (rarity1TCs.length > 0) {
			const firstTC = rarity1TCs[0];

			currTc[TC_ITEM_COLUMN_PREFIX + index] = firstTC[TC_NAME_COLUMN];
			currTc[TC_PROBABILITY_COLUMN_PREFIX + index] = itemsRarity1.length * RARITY1;
			index++;
		}

		if (rarity2TCs.length > 0) {
			const firstTC = rarity2TCs[0];

			currTc[TC_ITEM_COLUMN_PREFIX + index] = firstTC[TC_NAME_COLUMN];
			currTc[TC_PROBABILITY_COLUMN_PREFIX + index] = itemsRarity2.length * RARITY2;
			index++;
		}

		if (rarity3TCs.length > 0) {
			const firstTC = rarity3TCs[0];

			currTc[TC_ITEM_COLUMN_PREFIX + index] = firstTC[TC_NAME_COLUMN];
			currTc[TC_PROBABILITY_COLUMN_PREFIX + index] = itemsRarity3.length * RARITY3;
			index++;
		}

		insertTreasureClassAtIndex(TREASURE_CLASS_EX_FILE.rows, TC_INDEX_AFTER_GOLD, currTc);

		if (rarity1TCs.length > 0) {
			rarity1TCs.forEach(tc => insertTreasureClassAtIndex(TREASURE_CLASS_EX_FILE.rows, TC_INDEX_AFTER_GOLD, tc));
		}

		if (rarity2TCs.length > 0) {
			rarity2TCs.forEach(tc => insertTreasureClassAtIndex(TREASURE_CLASS_EX_FILE.rows, TC_INDEX_AFTER_GOLD, tc));
		}

		if (rarity3TCs.length > 0) {
			rarity3TCs.forEach(tc => insertTreasureClassAtIndex(TREASURE_CLASS_EX_FILE.rows, TC_INDEX_AFTER_GOLD, tc));
		}

		TREASURE_CLASS_EX_FILE.rows.forEach(currRow => updateTcReferences(currRow, tcNamePrefix + currTcNumber, currTcName));
	}
}

function getTcNamePrefix(itemType, itemSubType) {
	if(itemSubType === ITEM_SUB_TYPE_WEAPON_MELEE) {
		return TC_NAME_WEAPON_MELEE_PREFIX;
	}
	if(itemSubType === ITEM_SUB_TYPE_WEAPON_MISSILE) {
		return TC_NAME_WEAPON_MISSILE_PREFIX;
	}

	if(itemType === ITEM_TYPE_WEAPON) {
		return TC_NAME_WEAPON_PREFIX;
	}
	if(itemType === ITEM_TYPE_ARMOR) {
		return TC_NAME_ARMOR_PREFIX;
	}

	throw "Given item type: " + itemType + " is not a known type!";
}

function getItems(itemType, treasureClassNumber) {
	const selectedItems = getItemFile(itemType).rows.filter((row) => treasureClassNumber - TC_SIZE < row.level && row.level <= treasureClassNumber);

	const enrichedItems = selectedItems.map(item => ({
		category: itemType,
		name: item.name,
		level: item.level,
		code: item.code,
		type: item.type,
		typeRarity: getItemTypeRarity(item.type),
		subType: (itemType === ITEM_TYPE_WEAPON) ? (getWeaponSubType(item.type)) : (NO_ITEM_SUB_TYPE),
		remove: config[item.code],
	}));

	return enrichedItems;
}

function getItemFile(itemType) {
	if (itemType === ITEM_TYPE_ARMOR) {
		return ARMOR_FILE;
	}

	if (itemType === ITEM_TYPE_WEAPON) {
		return WEAPONS_FILE;
	}

	throw "Given item type: " + itemType + " is not a known type!";
}

function getItemTypeRarity(itemeCode) {
	return ITEM_TYPES_FILE.rows.find((row) => row.Code === itemeCode).Rarity;
}

function getWeaponSubType(weaponTypeCode) {
	if (weaponTypeCode === "") {
		return NO_WEAPON_SUB_TYPE;
	}

	if (weaponTypeCode === "mele" || weaponTypeCode === "miss") {
		return weaponTypeCode;
	}

	const weaponType = ITEM_TYPES_FILE.rows.find((row) => row.Code === weaponTypeCode);
	const weaponSubTypeCode = weaponType[ITEM_TYPES_SUB_TYPE_COLUMN];

	return getWeaponSubType(weaponSubTypeCode);
}

function isEmptyTc(itemType, itemSubType, currTcNumber) {
	return itemType === ITEM_TYPE_WEAPON && itemSubType === ITEM_SUB_TYPE_WEAPON_MISSILE && (currTcNumber === 21 || currTcNumber === 66);
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Treasure Classes Functions ////////////////////////
///////////////////////////////////////////////////////////////////////////////

function generateTcRows(items, treasureClassNumber, tcNamePrefix, rarityNumber, part) {
	if (part === undefined) {
		part = "";
	}
	if (items.length === 0) {
		return {};
	}

	const newTcName = tcNamePrefix + addTreasureClassPadding(treasureClassNumber) + TC_NAME_SUFFIX + TC_NAME_RARIRY_SUFFIX + rarityNumber + part;

	if (items.length > 10) {
		if (items.length > 20) {
			let s = "";
			items.forEach(item => s += item.code + "; ");
			throw "More than 20 items for treasureClassNumber = " + treasureClassNumber + "; rarityNumber = " + rarityNumber + "; tcNamePrefix = " + tcNamePrefix + "; newTcName = " + newTcName + "! The items are " + s + "!";
		}

		const firstTenItems = items.slice(0, TC_MAX_ITEMS);
		const restItems = items.slice(TC_MAX_ITEMS);

		let s1 = "";
		firstTenItems.forEach(item => s1 += item.code + "; ");

		let s2 = "";
		restItems.forEach(item => s2 += item.code + "; ");

		const firstSubTc = generateTcRows(firstTenItems, treasureClassNumber, tcNamePrefix, rarityNumber, TC_NAME_PART_SUFFIX + 1);
		const secondSubTc = generateTcRows(restItems, treasureClassNumber, tcNamePrefix, rarityNumber, TC_NAME_PART_SUFFIX + 2);

		const newTreasureClassRows = [
			{
				[TC_NAME_COLUMN]: newTcName,
				level: treasureClassNumber,
				Picks: 1,
				[TC_NO_DROP_COLUMN]: 0,
				Item1: firstSubTc[0][TC_NAME_COLUMN],
				Prob1: firstTenItems.length,
				Item2: secondSubTc[0][TC_NAME_COLUMN],
				Prob2: restItems.length,
			},
			firstSubTc[0],
			secondSubTc[0]
		];

		return newTreasureClassRows;
	}

	let newTreasureClassRow = {
		[TC_NAME_COLUMN]: newTcName,
		level: treasureClassNumber,
		Picks: 1,
	};

	let noDropChance = 0;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		noDropChance += (item.remove) ? (+item.typeRarity) : (0);
		newTreasureClassRow[TC_ITEM_COLUMN_PREFIX + (i + 1)] = item.code;
		newTreasureClassRow[TC_PROBABILITY_COLUMN_PREFIX + (i + 1)] = (item.remove) ? (0) : (item.typeRarity);
	}

	newTreasureClassRow[TC_NO_DROP_COLUMN] = noDropChance;

	return [newTreasureClassRow];
}

function addTreasureClassPadding(treasureClassNumber) {
	return `${treasureClassNumber}`.padStart(2, '0');
}

function insertTreasureClassAtIndex(tcRows, index, newTc) {
	tcRows.splice(index, REMOVE_NO_ELEMENTS, newTc);
}

function updateTcReferences(currRow, oldTcName, newTcName) {
	for (let i = 1; i <= 10; i++) {
		const currItemIndex = TC_ITEM_COLUMN_PREFIX + i;
		const currItemName = currRow[currItemIndex];

		if (currItemName != null && currItemName === oldTcName) {
			currRow[currItemIndex] = newTcName;
		}
	}
}

function updateTreasureClassRowToFullNoDrop(treasureClassRow) {
	for (let i = 1; i <= 10; i++) {
		const currItemIndex = 'Item' + i;
		if (treasureClassRow[currItemIndex] !== "") {
			const currItemProbabilityIndex = 'Prob' + i;
			treasureClassRow[currItemProbabilityIndex] = 0;
		}
	}

	treasureClassRow[TC_NO_DROP_COLUMN] = 100;
}

function updateTreasureClassRowItemToNoDrop(treasureClassRow, itemCode) {
	for (let i = 1; i <= 10; i++) {
		const currItemIndex = 'Item' + i;
		const currItemProbabilityIndex = 'Prob' + i;

		if (treasureClassRow[currItemIndex] === itemCode) {
			treasureClassRow[TC_NO_DROP_COLUMN] = intNvl(treasureClassRow[TC_NO_DROP_COLUMN]) + intNvl(treasureClassRow[currItemProbabilityIndex]);
			treasureClassRow[currItemProbabilityIndex] = 0;
		}
	}
}

function intNvl(integer) {
	if (integer == null || integer === "") {
		return 0;
	}

	return +integer;
}
