function horseBreed() {
	/* Grade Table */
	this.GradeInit = 165; /* T1 Male */
	this.gradeTitsBonus = 30; /* Tits Bonus */
	this.gradeInc = 65; /* T++ */
	/* Breed Table */
	this.breedStep = 50; /* Grade++ */
	this.breedResultInit = 155; /* Grade 0 */
	this.breedResultInc = 20; /* Min. Grade Result */
	this.breedResultMultiply = 11; /* Max. Result = Min + i*11 */
	this.breedResultStatic = { /* Max. Result for Grade 16+ */
		15: 600,
		16: 600,
		17: 630,
		18: 660,
		19: 660,
		20: 660,
	};
	/* Formular Config */
	this.maxTier = 8;
	this.maxLevel = 30;
	this.maxGradeIndex = 20;
	this.breedRegionRate = 13;
	this.maxDeaths = 100;
}

horseBreed.prototype.handle = function(e, channel, args) {
	if (args.length !== 4 && args.length !== 6) {
		e.message.reply('Usage: ```' + channel.prefix + 'horse <Male Tier> <M. Level> [<M. Deaths>] <Female Tier> <F. Level> [<F. Deaths>]```' +
			"*Example: ``" + channel.prefix + "horse 2 29 2 28``*");
	}
	else {
		/* Numbers only */
		var argsOK = true;
		for (var i = 0; i < args.length; i++) {
			if (isNaN(parseInt(args[i], 10))) {
				argsOK = false;
			}
		}

		if (!argsOK) {
			e.message.reply('Only numbers are allowed, please check your input!');
		}
		else {
			var mTier = args[0];
			var mLevel = args[1];
			var mDeaths = 0;
			var fTier = args[2];
			var fLevel = args[3];
			var fDeaths = 0;

			/* Optional */
			if (args.length === 6) {
				mDeaths = args[2];
				fTier = args[3];
				fLevel = args[4];
				fDeaths = args[5];
			}

			try {
				var grade = this.calcAvgGrade(mTier, mLevel, mDeaths, fTier, fLevel, fDeaths);
				var results = "";
				var horses = this.getResults(grade);

				horses.forEach((horse) => {
					results += "\n**T" + horse[0] + "** " + (horse[1] ? 'Female' : 'Male') + " *(" + horse[2] + "%)*";
				});
				var fields = [{
					name: "Male Horse :mens:",
					value: "**T" + mTier + "** - Level **" + mLevel + "** *(" + mDeaths + " Deaths)*",
					inline: true
				}, {
					name: "Female Horse :womens:",
					value: "**T" + fTier + "** - Level **" + fLevel + "** *(" + fDeaths + " Deaths)*",
					inline: true
				}, {
					name: "Possible Offsprings :baby_symbol:",
					value: results + "\n\u200B"
				}];
				e.message.reply("", false, {
					color: 0xc1694f,
					author: {
						name: "BDOBot Breeding Calculator"
					},
					fields: fields,
					footer: {
						text: "Current Grade: " + parseFloat(grade.toFixed(2)) +
							" | Next Grade: " + Math.ceil((grade + 1) / 50) * 50
					}
				});
			}
			catch (error) {
				e.message.reply(error);
			}
		}
	}
};

horseBreed.prototype.getGrade = function(tier, female) {
	/* Error */
	if (tier < 1 || tier > this.maxTier) {
		throw new Error('Invalid Tier! (Max. Tier: ' + this.maxTier + ')');
	}

	/* Formular */
	var grade = this.GradeInit + this.gradeInc * (tier - 1);

	/* Tits Bonus */
	if (female === 1) {
		grade += this.gradeTitsBonus;
	}

	return grade;
};

horseBreed.prototype.getMinResult = function(index) {
	/* Error */
	if (index < 0 || index > this.maxGradeIndex) {
		throw new Error('Invalid Grade Index! (Max. Grade Index: ' + this.maxGradeIndex + ')');
	}

	/* Formular */
	return this.breedResultInit + this.breedResultInc * index;
};

horseBreed.prototype.getMaxResult = function(index) {
	/* Error */
	if (index < 0 || index > this.maxGradeIndex) {
		throw new Error('Invalid Grade Index! (Max. Grade Index: ' + this.maxGradeIndex + ')');
	}

	/* Static Table */
	if (this.breedResultStatic[index] != null) {
		return this.breedResultStatic[index];
	}

	/* Formular */
	return this.getMinResult(index) + this.breedResultMultiply * (index + 1);
};

horseBreed.prototype.calcGrade = function(tier, level, deaths, female) {
	/* Error */
	if (tier < 1 || tier > this.maxTier) {
		throw new Error('Invalid Tier! (Max. Tier: ' + this.maxTier + ')');
	}
	else if (level < 1 || level > this.maxLevel) {
		throw new Error('Invalid Level! (Max. Level: ' + this.maxLevel + ')');
	}
	else if (deaths < 0 || deaths > this.maxDeaths) {
		throw new Error('Invalid Death Count! (Max. Death Count: ' + this.maxDeaths + ')');
	}

	/* Tier Grade */
	var grade = this.getGrade(tier, female);

	/* Level Bonus */
	grade += level * this.breedRegionRate;

	/* Death Impact */
	grade *= (1 - (deaths * 0.005));

	/* Formular */
	return grade;
};

horseBreed.prototype.calcAvgGrade = function(mTier, mLevel, mDeaths, fTier, fLevel, fDeaths) {
	/* Tier Grade */
	var mGrade = this.calcGrade(mTier, mLevel, mDeaths);
	var fGrade = this.calcGrade(fTier, fLevel, fDeaths, 1);

	/* Formular */
	return (mGrade + fGrade) / 2;
};

horseBreed.prototype.getOverlap = function(tmin, tmax, smin, smax) {
	var o = Math.min(tmax, smax) - Math.max(tmin, smin) + 1;
	return o > 0 ? o : 0;
};

horseBreed.prototype.getResults = function(grade) {
	var index = Math.floor(grade / this.breedStep);
	if (index > 20) {
		index = 20;
	}

	var result = [];
	var rmin = this.getMinResult(index);
	var rmax = this.getMaxResult(index);
	var total = rmax - rmin + 1;

	var min = this.GradeInit;
	for (var t = 1; t < 9; t++) {
		/* Male */
		var max = min + this.gradeTitsBonus - 1;
		var overlap = this.getOverlap(rmin, rmax, min, max);
		if (overlap) {
			result.push([t, 0, (overlap / total * 100).toFixed(2)]);
		}
		min = max + 1;

		/* Female */
		max = this.GradeInit + this.gradeInc * t - 1;
		var overlap2 = this.getOverlap(rmin, rmax, min, max);
		if (overlap2) {
			result.push([t, 1, (overlap2 / total * 100).toFixed(2)]);
		}
		min = max + 1;
	}

	return result;
};

module.exports = new horseBreed();