const fs = require('fs');
const ical = require('ical-generator');
const moment = require('moment');
const http = require('http');

fs.readFile('./data.json', (err, content) => {
	const data = JSON.parse(content);
	const currentYear = data.academic_years[data.academic_years.length - 1];
	
	const currentSubjects = data.subjects.filter(subject => subject.year_guid === currentYear.guid);

	const cal = ical({
        domain: 'sebbo.net',
        prodId: {company: 'superman-industries.com', product: 'ical-generator'},
        name: 'MyStudyLife',
        timezone: 'Europe/London'
    });
	
	const events = [];
	data.classes.map(c => {
		const matching = currentSubjects.filter(subject => subject.guid === c.subject_guid);
		if (matching[0]) {
			const start = moment(currentYear.start_date).startOf('isoweek');
			const subject = matching[0];
			const dayOfWeek = Math.log(c.times[0].days)/Math.log(2);
			
			const startTime = moment(c.times[0].start_time, 'HH:mm:ss');
			start.isoWeekday(dayOfWeek);
			start.hour(startTime.hour());
			start.minute(startTime.minute());

			const endTime = moment(c.times[0].end_time, 'HH:mm:ss');
			const end = start.clone();
			end.isoWeekday(dayOfWeek);
			end.hour(endTime.hour());
			end.minute(endTime.minute());

		
			const event = {
				summary: `${subject.name}: ${c.module}`,
				location: c.room,
				start: start.toDate(),
				end: end.toDate(),
				timezone: 'Europe/London',
			};
			const repeating = {
				freq: 'WEEKLY',
				interval: 1,
			};
			if (c.times[0].rotation_week) {
				repeating.interval = 2;
			}
			event.repeating = repeating;
			events.push(event);
		}
	});

	cal.events(events);
	
	http.createServer(function(req, res) {
		cal.serve(res);
	}).listen(3000, '127.0.0.1', function() {
	    console.log('Server running at http://127.0.0.1:3000/');
	});
});