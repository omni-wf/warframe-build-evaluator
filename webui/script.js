document.querySelectorAll("[data-repeat-count]").forEach(elm => {
	for (let i = 0; i != elm.getAttribute("data-repeat-count"); ++i)
	{
		elm.parentNode.insertBefore(elm.cloneNode(true), elm.nextSibling);
	}
});

function create_option(key, value)
{
	let option = document.createElement("option");
	option.setAttribute("data-key", key);
	option.value = value;
	return option;
}

var data_promise = new Promise(resolve => {
	fetch("../data.json")
	.then(response => response.json())
	.then(data => resolve(data));
});

function get_data()
{
	return data_promise;
}

data_promise.then(data => {
	Object.keys(data.mods).forEach(key => {
		let item = data.mods[key];
		if (!item.exclude)
		{
			if (item.type)
			{
				if (item.type == "WARFRAME" || item.type == "AURA")
				{
					document.getElementById("datalist-powersuit-mods").appendChild(create_option(key, item.name));
				}
				else if (item.type == "PRIMARY"
					|| item.type == "---" // For /Lotus/Upgrades/Mods/Rifle/WeaponSnipersConvertAmmoMod
					)
				{
					document.getElementById("datalist-primary-mods").appendChild(create_option(key, item.name));
				}
				else if (item.type == "SECONDARY")
				{
					document.getElementById("datalist-secondary-mods").appendChild(create_option(key, item.name));
				}
				else if (item.type == "MELEE" || item.type == "STANCE")
				{
					document.getElementById("datalist-melee-mods").appendChild(create_option(key, item.name));
				}
			}
			else
			{
				document.getElementById("datalist-powersuit-mods").appendChild(create_option(key, item.name));
				document.getElementById("datalist-primary-mods").appendChild(create_option(key, item.name));
				document.getElementById("datalist-secondary-mods").appendChild(create_option(key, item.name));
				document.getElementById("datalist-melee-mods").appendChild(create_option(key, item.name));
			}
		}
	});
	Object.keys(data.powersuits).forEach(key => {
		let item = data.powersuits[key];
		if (item.name.substr(0, 11) != "<ARCHWING> ")
		{
			document.getElementById("datalist-powersuits").appendChild(create_option(key, item.name));
		}
	});
	Object.keys(data.weapons).forEach(key => {
		let item = data.weapons[key];
		if (item.productCategory == "LongGuns")
		{
			document.getElementById("datalist-primaries").appendChild(create_option(key, item.name));
		}
		else if (item.productCategory == "Pistols")
		{
			document.getElementById("datalist-secondaries").appendChild(create_option(key, item.name));
		}
		else if (item.productCategory == "Melee")
		{
			document.getElementById("datalist-melees").appendChild(create_option(key, item.name));
		}
	});
	Object.keys(data.enemies).forEach(key => {
		let item = data.enemies[key];
		document.getElementById("datalist-enemies").appendChild(create_option(key, item.name + (item.eximus ? " Eximus" : "")));
	});
});

function get_key(input)
{
	return document.getElementById(input.getAttribute("list")).querySelector("[value='"+input.value.split("'").join("\\'")+"']")?.getAttribute("data-key");
}

function set_key(input, key)
{
	input.value = document.getElementById(input.getAttribute("list")).querySelector("[data-key='"+key+"']").value;
}

function initial_evaluation()
{
	evaluate_build();
	document.querySelectorAll("input[list], input[type='number'], select").forEach(elm => {
		elm.oninput = () => evaluate_build();
	});
}

function unpack_mods(elms, mods)
{
	var mod_i = 0, crystal_i = 0;
	Object.values(mods).forEach(mod => {
		if (mod.name.substr(0, 52) == "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/")
		{
			set_key(document.querySelectorAll("input[list='datalist-crystals']")[crystal_i++], mod.name);
		}
		else
		{
			set_key(elms[mod_i], mod.name);
			elms[mod_i].parentNode.querySelector("input[type='number']").valueAsNumber = mod.rank;
			++mod_i;
		}
	});
}

function ready_to_evaluate()
{
	let share = location.hash.substr(1);
	if (share)
	{
		pluto_invoke("unpack_share", base64url_decode(share)).then(build => {
			if (build.powersuit)
			{
				if (build.powersuit.name)
				{
					set_key(document.querySelector("input[list='datalist-powersuits']"), build.powersuit.name);
				}
				unpack_mods(document.querySelectorAll("input[list='datalist-powersuit-mods']"), build.powersuit.mods);
			}
			if (build.primary)
			{
				if (build.primary.name)
				{
					set_key(document.querySelector("input[list='datalist-primaries']"), build.primary.name);
				}
				unpack_mods(document.querySelectorAll("input[list='datalist-primary-mods']"), build.primary.mods);
			}
			if (build.secondary)
			{
				if (build.secondary.name)
				{
					set_key(document.querySelector("input[list='datalist-secondaries']"), build.secondary.name);
				}
				unpack_mods(document.querySelectorAll("input[list='datalist-secondary-mods']"), build.secondary.mods);
			}
			if (build.melee)
			{
				if (build.melee.name)
				{
					set_key(document.querySelector("input[list='datalist-melees']"), build.melee.name);
				}
				unpack_mods(document.querySelectorAll("input[list='datalist-melee-mods']"), build.melee.mods);
			}
			if (build.operator)
			{
				document.querySelector("select").value = build.operator.phoenix_talons;
			}
			initial_evaluation();
		});
	}
	else
	{
		initial_evaluation();
	}
}

function tally_mods(elm)
{
	let mods = [];
	elm.forEach(input => {
		let key = get_key(input);
		let rank_input = input.parentNode.querySelector("input[type='number']");
		input.style.borderColor = "";
		if (key)
		{
			pluto_invoke("get_max_rank", key).then(max_rank => {
				if (rank_input.max != max_rank)
				{
					rank_input.max = max_rank;
					rank_input.valueAsNumber = max_rank;
				}
			});
			let rank = input.parentNode.querySelector("input[type='number']").valueAsNumber;
			if (isNaN(rank))
			{
				rank = 0;
			}
			mods.push({ name: key, rank: rank });
		}
		else
		{
			rank_input.valueAsNumber = 0;
			rank_input.max = 0;
			if (input.value != "")
			{
				input.style.borderColor = "red";
			}
		}
	});
	return mods;
}

function evaluate_build()
{
	let inbuild = {};

	inbuild.powersuit = {
		name: get_key(document.querySelector("input[list='datalist-powersuits']")),
		mods: tally_mods(document.querySelectorAll("input[list='datalist-powersuit-mods']"))
	};
	document.querySelectorAll("input[list='datalist-crystals']").forEach(input => {
		let key = get_key(input);
		input.style.borderColor = "";
		if (key)
		{
			inbuild.powersuit.mods.push({ name: key });
		}
		else if (input.value != "")
		{
			input.style.borderColor = "red";
		}
	});

	inbuild.primary = {
		name: get_key(document.querySelector("input[list='datalist-primaries']")),
		mods: tally_mods(document.querySelectorAll("input[list='datalist-primary-mods']"))
	};

	inbuild.secondary = {
		name: get_key(document.querySelector("input[list='datalist-secondaries']")),
		mods: tally_mods(document.querySelectorAll("input[list='datalist-secondary-mods']"))
	};

	inbuild.melee = {
		name: get_key(document.querySelector("input[list='datalist-melees']")),
		mods: tally_mods(document.querySelectorAll("input[list='datalist-melee-mods']"))
	};

	{
		let phoenix_talons = parseInt(document.querySelector("select").value);
		if (phoenix_talons >= 0)
		{
			inbuild.operator = { phoenix_talons };
		}
	}

	let conditionals = {};
	document.querySelectorAll("#conditionals input").forEach(input => {
		conditionals[input.id] = input.type == "checkbox" ? (input.checked ? 1 : 0) : input.value;
		if (input.id == "/Lotus/Upgrades/CosmeticEnhancers/Offensive/OnComboTierCondition")
		{
			--conditionals[input.id];
		}
	});

	let enemy = get_key(document.querySelector("input[list='datalist-enemies']"));
	let enemy_level = document.getElementById("simulator-level").valueAsNumber;
	if (enemy && !isNaN(enemy_level))
	{
		pluto_invoke("evaluate_build", inbuild, conditionals, enemy, enemy_level);
	}
	else
	{
		pluto_invoke("evaluate_build", inbuild, conditionals);
	}
}

function base64url_encode(uintArray)
{
    let binaryString = Array.from(uintArray).map(byte => String.fromCharCode(byte)).join('');
    let base64String = btoa(binaryString);
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64url_decode(str)
{
    let paddedStr = str.padEnd(str.length + (4 - str.length % 4) % 4, '=');
    let base64String = paddedStr.replace(/-/g, '+').replace(/_/g, '/');
    let binaryString = atob(base64String);
    let uintArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
    {
        uintArray[i] = binaryString.charCodeAt(i);
    }
    return uintArray;
}

function update_export(str)
{
	console.log(str);
}

const friendly_conditional_names = {
	"/Lotus/Upgrades/CosmeticEnhancers/Offensive/OnComboTierCondition": "Combo",
	"PM_HEAVY_MELEE": "Heavy Attack",
	"CC_SLIDING": "Slide Attack",
};

function update_conditionals(conditionals)
{
	Object.keys(conditionals).sort().forEach(conditional_name => {
		if (!document.getElementById(conditional_name))
		{
			let conditional = conditionals[conditional_name];

			let label = document.createElement("label");
			label.setAttribute("for", conditional_name);
			label.textContent = (document.querySelector("[data-key='"+conditional_name+"']")?.value ?? friendly_conditional_names[conditional_name] ?? conditional_name) + ": ";

			let input = document.createElement("input");
			input.id = conditional_name;
			if (conditional.max_stacks == 1)
			{
				input.type = "checkbox";
			}
			else
			{
				input.type = "number";
				input.min = 0;
				input.max = conditional.max_stacks;
				if (conditional_name == "/Lotus/Upgrades/CosmeticEnhancers/Offensive/OnComboTierCondition")
				{
					++input.min;
					++input.max;
				}
				input.value = input.min;
			}
			input.oninput = () => evaluate_build();

			let li = document.createElement("li");
			li.appendChild(label);
			li.appendChild(input);
			document.querySelector("#conditionals ul").appendChild(li);
		}
	});
	document.querySelectorAll("#conditionals li").forEach(li => {
		if (!conditionals[li.querySelector("input").id])
		{
			li.parentNode.removeChild(li);
		}
	});
}

function add_stat(ul, stat, fmt)
{
	let li = document.createElement("li");
	li.textContent = fmt.split("{}").join(stat.toFixed(1));
	ul.appendChild(li);
}

function add_opt_stat(ul, stat, fmt)
{
	if (stat != 0)
	{
		add_stat(ul, stat, fmt);
	}
}

function format_crit_value(value, tier)
{
	if (tier == 0)
	{
		return value;
	}
	else if (tier == 1)
	{
		return '<span style="color:yellow">' + value + '</span>';
	}
	else if (tier == 2)
	{
		return '<span style="color:orange">' + value + '</span>';
	}
	else
	{
		return '<span style="color:red">' + value + '!'.repeat(tier - 3) + '</span>';
	}
}

function format_crit_tier(tier)
{
	return format_crit_value("T"+tier, tier);
}

function add_gear_evaluation(ul, gear)
{
	add_opt_stat(ul, gear.dmg_impact, "{} Impact");
	add_opt_stat(ul, gear.dmg_puncture, "{} Puncture");
	add_opt_stat(ul, gear.dmg_slash, "{} Slash");
	add_opt_stat(ul, gear.dmg_heat, "{} Heat");
	add_opt_stat(ul, gear.dmg_cold, "{} Cold");
	add_opt_stat(ul, gear.dmg_electricity, "{} Electricity");
	add_opt_stat(ul, gear.dmg_toxin, "{} Toxin");
	add_opt_stat(ul, gear.dmg_blast, "{} Blast");
	add_opt_stat(ul, gear.dmg_radiation, "{} Radiation");
	add_opt_stat(ul, gear.dmg_gas, "{} Gas");
	add_opt_stat(ul, gear.dmg_magnetic, "{} Magnetic");
	add_opt_stat(ul, gear.dmg_viral, "{} Viral");
	add_opt_stat(ul, gear.dmg_corrosive, "{} Corrosive");
	{
		let li = document.createElement("li");
		li.textContent = gear.fire_rate.toFixed(2) + (gear.combo_duration ? " Attack Speed" : " Fire Rate");
		ul.appendChild(li);
	}
	{
		let li = document.createElement("li");
		li.textContent = (gear.crit_chance * 100).toFixed(1) + "% Critical Chance";
		{
			let nested_ul = document.createElement("ul");
			{
				let nested_li = document.createElement("li");
				nested_li.innerHTML = (gear.crit_tier_chance * 100).toFixed(1) + "% Chance for " + format_crit_tier(gear.crit_tier) + " @ " + gear.crit_tier_damage.toFixed(1) + "x";
				nested_ul.appendChild(nested_li);
			}
			{
				let nested_li = document.createElement("li");
				nested_li.innerHTML = (gear.crit_fail_tier_chance * 100).toFixed(1) + "% Chance for " + format_crit_tier(gear.crit_fail_tier) + " @ " + gear.crit_fail_tier_damage.toFixed(1) + "x";
				nested_ul.appendChild(nested_li);
			}
			{
				let nested_li = document.createElement("li");
				nested_li.textContent = gear.crit_damage_avg.toFixed(2) + "x Average Multiplier";
				nested_ul.appendChild(nested_li);
			}
			li.appendChild(nested_ul);
		}
		ul.appendChild(li);
	}
}

function update_evaluation(outbuild)
{
	let evalbody = document.getElementById("evaluation-body");
	evalbody.textContent = "";

	if (outbuild.powersuit)
	{
		let p = document.createElement("p");
		p.innerHTML = "<b>Warframe:</b>";
		evalbody.appendChild(p);

		let ul = document.createElement("ul");
		{
			let li = document.createElement("li");
			li.textContent = outbuild.powersuit.effective_health_incl_power.toFixed(1) + " Effective Health";
			{
				let nested_ul = document.createElement("ul");
				{
					let nested_li = document.createElement("li");
					nested_li.textContent = outbuild.powersuit.health.toFixed(1) + " Health";
					nested_ul.appendChild(nested_li);
				}
				{
					let nested_li = document.createElement("li");
					nested_li.textContent = outbuild.powersuit.armor.toFixed(1) + " Armor reduces " + (outbuild.powersuit.armor_damage_reduction * 100).toFixed(1) + "% of incoming damage";
					nested_ul.appendChild(nested_li);
				}
				{
					let nested_li = document.createElement("li");
					nested_li.textContent = outbuild.powersuit.power.toFixed(1) + " Energy can be converted to health with " + (outbuild.powersuit.power_to_health_efficiency * 100).toFixed(0) + "% efficiency";
					nested_ul.appendChild(nested_li);
				}
				if (outbuild.powersuit.heal_rate != 0)
				{
					let nested_li = document.createElement("li");
					nested_li.textContent = "+ " + outbuild.powersuit.heal_rate.toFixed(1) + " Health regenerated per second";
					nested_ul.appendChild(nested_li);
				}
				li.appendChild(nested_ul);
			}
			ul.appendChild(li);
		}
		add_stat(ul, outbuild.powersuit.shield, "{} Shield");
		add_stat(ul, outbuild.powersuit.ability_duration * 100, "{}% Ability Duration");
		add_stat(ul, outbuild.powersuit.ability_efficiency * 100, "{}% Ability Efficiency");
		add_stat(ul, outbuild.powersuit.ability_range * 100, "{}% Ability Range");
		add_stat(ul, outbuild.powersuit.ability_strength * 100, "{}% Ability Strength");
		{
			let li = document.createElement("li");
			li.textContent = outbuild.powersuit.movement_speed.toFixed(2) + " Movement Speed (" + outbuild.powersuit.movement_speed_mps.toFixed(1) + "m/s)";
			ul.appendChild(li);
		}
		{
			let li = document.createElement("li");
			li.textContent = outbuild.powersuit.sprint_speed.toFixed(2) + " Sprint Speed (" + outbuild.powersuit.sprint_speed_mps.toFixed(1) + "m/s)";
			ul.appendChild(li);
		}
		evalbody.appendChild(ul);
	}

	if (outbuild.primary)
	{
		let p = document.createElement("p");
		p.innerHTML = "<b>Primary:</b>";
		evalbody.appendChild(p);

		let ul = document.createElement("ul");
		add_gear_evaluation(ul, outbuild.primary);
		evalbody.appendChild(ul);
	}

	if (outbuild.secondary)
	{
		let p = document.createElement("p");
		p.innerHTML = "<b>Secondary:</b>";
		evalbody.appendChild(p);

		let ul = document.createElement("ul");
		add_gear_evaluation(ul, outbuild.secondary);
		evalbody.appendChild(ul);
	}

	if (outbuild.melee)
	{
		let p = document.createElement("p");
		p.innerHTML = "<b>Melee:</b>";
		evalbody.appendChild(p);

		let ul = document.createElement("ul");
		add_gear_evaluation(ul, outbuild.melee);
		add_stat(ul, outbuild.melee.combo_duration, "{}s Combo Duration");
		evalbody.appendChild(ul);
	}

	if (evalbody.textContent == "")
	{
		document.getElementById("quick-start").style.display = "block";
		evalbody.textContent = "Evaluator is ready.";
	}
	else
	{
		document.getElementById("quick-start").style.display = "none";
	}
}

function add_to_simulator(name, dmgeval, outbuild_gear)
{
	let p = document.createElement("p");
	p.innerHTML = "<b>" + name + ":</b>";
	document.getElementById("simulator-body").appendChild(p);

	let ul = document.createElement("ul");
	{
		let li = document.createElement("li");
		li.innerHTML = "Normal Damage: " + format_crit_value(dmgeval.normal.toFixed(2), outbuild_gear.crit_fail_tier);
		ul.appendChild(li);
	}
	{
		let li = document.createElement("li");
		li.innerHTML = "Critical Damage: " + format_crit_value(dmgeval.crit.toFixed(2), outbuild_gear.crit_tier);
		ul.appendChild(li);
	}
	{
		let li = document.createElement("li");
		li.innerHTML = "Average Damage: " + format_crit_value(dmgeval.avg.toFixed(2), outbuild_gear.crit_tier_chance > 0.5 ? outbuild_gear.crit_tier : outbuild_gear.crit_fail_tier);
		ul.appendChild(li);
	}
	document.getElementById("simulator-body").appendChild(ul);
}

function update_share(share)
{
	location.hash = base64url_encode(new Uint8Array(Object.values(share)));
}
