import request from "request-promise-native";
import cheerio from "cheerio";

class Character {
    public static async search(charName: string) {
        const charData = await Character.getDetails(charName);
        if (!charData) return false;

        const charStats = await Character.getStats(charName, charData.class);
        if (!charStats) return false;

        const charEquip = await Character.getEquip(charName);
        if (!charEquip) return false;

        return {
            'title': 'Lv ' + charData.level + ((charData.hongmoonLevel > 0) ? ' HM ' + charData.hongmoonLevel : '') + ' - ' + charData.class + ' - ' + charData.server,
            'description': ((charData.faction !== '') ? '*' + charData.faction + ' - ' + charData.factionGrade + '*' : '') + ((charData.guild !== '') ? '\nGuild: ' + charData.guild : ''),
            'color': await Character.getColor(charData.faction),
            'footer': {
                'text': 'Realtime Data from NCSOFT'
            },
            'thumbnail': {
                'url': charData.thumbnail
            },
            'author': {
                'name': charData.name + ' [' + charData.account + ']',
                'icon_url': charData.classIcon
            },
            'fields': [
                {
                    'name': 'Stats',
                    'value': 'Attack Power\nPiercing\nAccuracy\nCritical Hit\nCritical Damage\nElement Damage\n\nHP\nDefense\nEvasion\nBlock\nCritical Defense\nHealth Regen\nRecovery Rate',
                    'inline': true
                },
                {
                    'name': 'Values',
                    'value': charStats.AP + '\n' +
                        charStats.piercing + '\n' +
                        charStats.accuracy[0] + ' (' + charStats.accuracy[1] + '%)\n' +
                        charStats.critHit[0] + ' (' + charStats.critHit[1] + '%)\n' +
                        charStats.critDmg[0] + ' (' + charStats.critDmg[1] + '%)\n' +
                        charStats.eleDmg[0] + ' ' + charStats.element[0] + ', ' + charStats.eleDmg[1] + ' ' + charStats.element[1] + '\n\n' +
                        charStats.HP + '\n' +
                        charStats.defense[0] + ' (' + charStats.defense[1] + '%)\n' +
                        charStats.evasion[0] + ' (' + charStats.evasion[1] + '%)\n' +
                        charStats.block[0] + ' (' + charStats.block[1] + '%)\n' +
                        charStats.critDef[0] + ' (' + charStats.critDef[1] + '% Rate, ' + charStats.critDef[2] + '% Reduction)\n' +
                        charStats.healthReg[0] + ' Out of Combat, ' + charStats.healthReg[1] + ' In Combat\n' +
                        charStats.recoveryRate[0] + ' (' + charStats.recoveryRate[1] + '%)\n',
                    'inline': true
                },
                {
                    'name': 'Weapon Gems',
                    'value': (charEquip.weaponGems !== '') ? charEquip.weaponGems : '-'
                },
                {
                    'name': 'Equipment Slot',
                    'value': 'Weapon\nRing\nEarring\nNecklace\nBracelet\nBelt\nGloves\nSoul\nHeart\nPet\nSoul Badge\nMystic Badge',
                    'inline': true
                },
                {
                    'name': 'Item',
                    'value': charEquip.weapon + '\n' +
                        charEquip.ring + '\n' +
                        charEquip.earring + '\n' +
                        charEquip.necklace + '\n' +
                        charEquip.bracelet + '\n' +
                        charEquip.belt + '\n' +
                        charEquip.gloves + '\n' +
                        charEquip.soul + '\n' +
                        charEquip.heart + '\n' +
                        charEquip.pet + '\n' +
                        charEquip.soulBadge + '\n' +
                        charEquip.mysticBadge,
                    'inline': true
                },
                {
                    'name': 'Soul Shield',
                    'value': (charEquip.baguas !== '') ? charEquip.baguas : '-'
                },
            ]
        };
    }

    private static async getDetails(charName: string) {
        let foundChar = true;
        let data = {
            account: '',
            name: '',
            class: '',
            classIcon: '',
            level: 0,
            hongmoonLevel: 0,
            server: '',
            faction: '',
            factionGrade: '',
            guild: '',
            thumbnail: '',
        };

        await request('http://eu-bns.ncsoft.com/ingame/bs/character/profile?c=' + encodeURI(charName), async function (error, response, html) {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(html);

                if ($('div').hasClass('wrapError')) {
                    foundChar = false;
                } else {
                    let charName = $('.signature dt span').text();
                    charName = charName.substr(1, charName.length - 2);
                    let faction: string[];
                    let tmpFaction = $('.desc ul li:nth-child(4)').html();
                    if (tmpFaction !== null) {
                        faction = tmpFaction.split('&#xA0;');
                    } else {
                        faction = ['', ''];
                    }

                    data.account = $('.signature dt a').text();
                    data.name = charName;
                    data.class = $('.desc ul li:nth-child(1)').text();
                    data.classIcon = $('.classThumb img').attr('src');
                    data.level = parseInt($('.desc ul li:nth-child(2)').text().split(' ')[1]);
                    data.hongmoonLevel = parseInt($('.masteryLv').text().split(' ')[1]) || 0;
                    data.server = $('.desc ul li:nth-child(3)').text();
                    data.faction = faction[0];
                    data.factionGrade = faction[1];
                    data.guild = $('.guild').text();
                    data.thumbnail = $('.charaterView img').attr('src');
                }
            } else {
                foundChar = false;
            }
        });
        if (!foundChar) return false;
        return data;
    }

    private static async getStats(charName: string, charClass: string) {
        let foundChar = true;
        let data = {
            AP: 0,
            piercing: 0,
            accuracy: [0, 0],
            critHit: [0, 0],
            critDmg: [0, 0],
            element: ['', ''],
            eleDmg: [0, 0],
            HP: 0,
            defense: [0, 0],
            evasion: [0, 0],
            block: [0, 0],
            critDef: [0, 0, 0],
            healthReg: [0, 0],
            recoveryRate: [0, 0]
        };

        await request('http://eu-bns.ncsoft.com/ingame/bs/character/data/abilities.json?c=' + encodeURI(charName), async function (error, response, jsonBody) {
            if (!error && response.statusCode === 200) {
                const body = JSON.parse(jsonBody);
                if (body['result'] === 'fail') {
                    foundChar = false;
                } else {
                    const ability = body['records']['total_ability'];
                    data.AP = ability['attack_power_value'];
                    data.piercing = ability['attack_pierce_value'];
                    data.accuracy = [ability['attack_hit_value'], ability['attack_hit_rate']];
                    data.critHit = [ability['attack_critical_value'], ability['attack_critical_rate']];
                    data.critDmg = [ability['attack_critical_damage_value'], ability['attack_critical_damage_rate']];
                    const elements = await Character.getElements(charClass);
                    data.element = [elements[0], elements[2]];
                    data.eleDmg = [ability[elements[1]], ability[elements[3]]];
                    data.HP = ability['max_hp'];
                    data.defense = [ability['defend_power_value'], ability['defend_physical_damage_reduce_rate']];
                    data.evasion = [ability['defend_dodge_value'], ability['defend_dodge_rate']];
                    data.block = [ability['defend_parry_value'], ability['defend_parry_rate']];
                    data.critDef = [ability['defend_critical_value'], ability['defend_critical_rate'], ability['defend_critical_damage_rate']];
                    data.healthReg = [ability['hp_regen'], ability['hp_regen_combat']];
                    data.recoveryRate = [ability['heal_power_value'], ability['heal_power_rate']];
                }
            } else {
                foundChar = false;
            }
        });
        if (!foundChar) return false;
        return data;
    }

    private static async getEquip(charName: string) {
        let foundChar = true;
        let data = {
            weapon: '',
            weaponGems: '',
            ring: '',
            earring: '',
            necklace: '',
            bracelet: '',
            belt: '',
            gloves: '',
            soul: '',
            heart: '',
            pet: '',
            soulBadge: '',
            mysticBadge: '',
            baguas: ''
        };

        await request('http://eu-bns.ncsoft.com/ingame/bs/character/data/equipments?c=' + encodeURI(charName), async function (error, response, html) {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(html);

                if ($('#equipResult').text() === 'fail') {
                    foundChar = false;
                } else {
                    let weapon = $('#equipItems .wrapWeapon .name span');
                    let ring = $('#equipItems .wrapAccessory.ring .name span');
                    let earring = $('#equipItems .wrapAccessory.earring .name span');
                    let necklace = $('#equipItems .wrapAccessory.necklace .name span');
                    let bracelet = $('#equipItems .wrapAccessory.bracelet .name span');
                    let belt = $('#equipItems .wrapAccessory.belt .name span');
                    let gloves = $('#equipItems .wrapAccessory.gloves .name span');
                    let soul = $('#equipItems .wrapAccessory.soul .name span');
                    let heart = $('#equipItems .wrapAccessory.soul-2 .name span');
                    let pet = $('#equipItems .wrapAccessory.guard .name span');
                    let soulBadge = $('#equipItems .wrapAccessory.singongpae .name span');
                    let mysticBadge = $('#equipItems .wrapAccessory.rune .name span');

                    data.weapon = weapon.hasClass('empty') ? '-' : weapon.text();
                    data.ring = ring.hasClass('empty') ? '-' : ring.text();
                    data.earring = earring.hasClass('empty') ? '-' : earring.text();
                    data.necklace = necklace.hasClass('empty') ? '-' : necklace.text();
                    data.bracelet = bracelet.hasClass('empty') ? '-' : bracelet.text();
                    data.belt = belt.hasClass('empty') ? '-' : belt.text();
                    data.gloves = gloves.hasClass('empty') ? '-' : gloves.text();
                    data.soul = soul.hasClass('empty') ? '-' : soul.text();
                    data.heart = heart.hasClass('empty') ? '-' : heart.text();
                    data.pet = pet.hasClass('empty') ? '-' : pet.text();
                    data.soulBadge = soulBadge.hasClass('empty') ? '-' : soulBadge.text();
                    data.mysticBadge = mysticBadge.hasClass('empty') ? '-' : mysticBadge.text();

                    const baguaNumber = {
                        0: '☵1',
                        1: '☶2',
                        2: '☳3',
                        3: '☴4',
                        4: '☲5',
                        5: '☷6',
                        6: '☱7',
                        7: '☰8'
                    };


                    $('#equipItems .wrapGem [name="gemIcon_pos"] area').each((i, el) => {
                        let $el = $(el);
                        data.baguas = data.baguas + ($el.attr('alt') !== '' ? $el.attr('alt') + ' ' + baguaNumber[i] : '-') + '\n';
                    });

                    $('#equipItems .wrapWeapon .enchant .iconGemSlot img').each((i, gem) => {
                        let $gem = $(gem);
                        data.weaponGems = data.weaponGems + $gem.attr('alt') + '\n';
                    });
                }
            } else {
                foundChar = false;
            }
        });
        if (!foundChar) return false;
        return data;
    }

    private static async getColor(faction: string) {
        if (faction === 'Cerulean Order') {
            return 5436671;
        } else if (faction === 'Crimson Legion') {
            return 10494241;
        } else {
            return 0;
        }
    }

    private static async getElements(charClass: string) {
        let elements = ['', '', '', ''];

        switch (charClass) {
            case 'Warlock':
                elements = [
                    'Frost', 'attack_attribute_ice_value',
                    'Shadow', 'attack_attribute_void_value'
                ];
                break;
            case 'Destroyer':
                elements = [
                    'Earth', 'attack_attribute_earth_value',
                    'Shadow', 'attack_attribute_void_value'
                ];
                break;
            case 'Blade Dancer':
                elements = [
                    'Wind', 'attack_attribute_wind_value',
                    'Lightning', 'attack_attribute_lightning_value'
                ];
                break;
            case 'Blade Master':
                elements = [
                    'Flame', 'attack_attribute_fire_value',
                    'Lightning', 'attack_attribute_lightning_value'
                ];
                break;
            case 'Soul Fighter':
                elements = [
                    'Earth', 'attack_attribute_earth_value',
                    'Frost', 'attack_attribute_ice_value'
                ];
                break;
            case 'Force Master':
                elements = [
                    'Flame', 'attack_attribute_fire_value',
                    'Frost', 'attack_attribute_ice_value'
                ];
                break;
            case 'Assassin':
                elements = [
                    'Shadow', 'attack_attribute_void_value',
                    'Lightning', 'attack_attribute_lightning_value'
                ];
                break;
            case 'Kung Fu Master':
                elements = [
                    'Wind', 'attack_attribute_wind_value',
                    'Flame', 'attack_attribute_fire_value'
                ];
                break;
            case 'Gunslinger':
                elements = [
                    'Flame', 'attack_attribute_fire_value',
                    'Shadow', 'attack_attribute_void_value'
                ];
                break;
            case 'Summoner':
                elements = [
                    'Wind', 'attack_attribute_wind_value',
                    'Earth', 'attack_attribute_earth_value'
                ];
            case 'Warden':
                elements = [
                    'Lightning', 'attack_attribute_lightning_value',
                    'Frost', 'attack_attribute_ice_value'
                ];
                break;
        }

        return elements;
    }
}

export {Character};