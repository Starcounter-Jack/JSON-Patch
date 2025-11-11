import {compare} from '../../module/duplex.mjs';
import {applyPatch, deepClone} from '../../module/core.mjs';

describe('Date object support', function () {
  describe('deepClone', function() {
    it('should clone Date objects correctly', function() {
      const originalDate = new Date('2025-11-11T10:00:00.000Z');
      const cloned = deepClone(originalDate);

      expect(cloned instanceof Date).toBe(true);
      expect(cloned.getTime()).toBe(originalDate.getTime());
      expect(cloned).not.toBe(originalDate); // Different instances
    });

    it('should clone objects containing Date objects', function() {
      const original = {
        name: 'Event',
        startTime: new Date('2025-11-11T10:00:00.000Z'),
        endTime: new Date('2025-11-11T11:00:00.000Z')
      };

      const cloned = deepClone(original);

      expect(cloned.startTime instanceof Date).toBe(true);
      expect(cloned.endTime instanceof Date).toBe(true);
      expect(cloned.startTime.getTime()).toBe(original.startTime.getTime());
      expect(cloned.endTime.getTime()).toBe(original.endTime.getTime());
      expect(cloned).not.toBe(original);
      expect(cloned.startTime).not.toBe(original.startTime);
    });

    it('should clone arrays of objects with Date objects', function() {
      const original = [
        { date: new Date('2025-11-11T10:00:00.000Z') },
        { date: new Date('2025-11-11T11:00:00.000Z') }
      ];

      const cloned = deepClone(original);

      expect(cloned[0].date instanceof Date).toBe(true);
      expect(cloned[1].date instanceof Date).toBe(true);
      expect(cloned[0].date.getTime()).toBe(original[0].date.getTime());
    });
  });

  describe('compare', function() {
    it('should detect changes in Date objects', function() {
      const obj1 = {
        event: {
          startTime: new Date('2025-11-11T10:00:00.000Z')
        }
      };

      const obj2 = {
        event: {
          startTime: new Date('2025-11-11T11:00:00.000Z')
        }
      };

      const patches = compare(obj1, obj2);

      expect(patches.length).toBe(1);
      expect(patches[0].op).toBe('replace');
      expect(patches[0].path).toBe('/event/startTime');
      expect(patches[0].value instanceof Date).toBe(true);
      expect(patches[0].value.getTime()).toBe(obj2.event.startTime.getTime());
    });

    it('should not generate patches for identical Date objects', function() {
      const date = new Date('2025-11-11T10:00:00.000Z');
      const obj1 = { startTime: date };
      const obj2 = { startTime: new Date('2025-11-11T10:00:00.000Z') };

      const patches = compare(obj1, obj2);

      expect(patches.length).toBe(0);
    });

    it('should handle Date objects in arrays', function() {
      const obj1 = {
        events: [
          { date: new Date('2025-11-11T10:00:00.000Z') }
        ]
      };

      const obj2 = {
        events: [
          { date: new Date('2025-11-11T10:00:00.000Z') },
          { date: new Date('2025-11-11T11:00:00.000Z') }
        ]
      };

      const patches = compare(obj1, obj2);

      expect(patches.length).toBe(1);
      expect(patches[0].op).toBe('add');
      expect(patches[0].value.date instanceof Date).toBe(true);
    });

    it('should detect when Date is added', function() {
      const obj1 = { name: 'Event' };
      const obj2 = { name: 'Event', startTime: new Date('2025-11-11T10:00:00.000Z') };

      const patches = compare(obj1, obj2);

      expect(patches.length).toBe(1);
      expect(patches[0].op).toBe('add');
      expect(patches[0].path).toBe('/startTime');
      expect(patches[0].value instanceof Date).toBe(true);
    });

    it('should detect when Date is removed', function() {
      const obj1 = { name: 'Event', startTime: new Date('2025-11-11T10:00:00.000Z') };
      const obj2 = { name: 'Event' };

      const patches = compare(obj1, obj2);

      expect(patches.length).toBe(1);
      expect(patches[0].op).toBe('remove');
      expect(patches[0].path).toBe('/startTime');
    });
  });

  describe('applyPatch', function() {
    it('should apply Date object patches correctly', function() {
      const obj = { startTime: new Date('2025-11-11T10:00:00.000Z') };
      const patches = [
        { op: 'replace', path: '/startTime', value: new Date('2025-11-11T11:00:00.000Z') }
      ];

      const result = applyPatch(obj, patches);

      expect(result.newDocument.startTime instanceof Date).toBe(true);
      expect(result.newDocument.startTime.getTime()).toBe(new Date('2025-11-11T11:00:00.000Z').getTime());
    });

    it('should handle adding Date objects', function() {
      const obj = { name: 'Event' };
      const patches = [
        { op: 'add', path: '/startTime', value: new Date('2025-11-11T10:00:00.000Z') }
      ];

      const result = applyPatch(obj, patches);

      expect(result.newDocument.startTime instanceof Date).toBe(true);
      expect(result.newDocument.startTime.getTime()).toBe(new Date('2025-11-11T10:00:00.000Z').getTime());
    });
  });

  describe('Real-world scenario', function() {
    it('should handle calendar events with Date objects', function() {
      const oldContext = {
        variables: {
          varCalendarEvents: []
        }
      };

      const newContext = {
        variables: {
          varCalendarEvents: [
            {
              startTime: new Date('2025-11-15T10:00:00.000Z'),
              endTime: new Date('2025-11-15T11:00:00.000Z'),
              subject: 'Meeting 1'
            },
            {
              startTime: new Date('2025-11-20T14:00:00.000Z'),
              endTime: new Date('2025-11-20T15:30:00.000Z'),
              subject: 'Meeting 2'
            }
          ]
        }
      };

      const patches = compare(oldContext, newContext);

      // Should generate patches for adding the array elements
      expect(patches.length).toBeGreaterThan(0);

      // Apply patches and verify
      const result = applyPatch(deepClone(oldContext), patches);
      expect(result.newDocument.variables.varCalendarEvents.length).toBe(2);
      expect(result.newDocument.variables.varCalendarEvents[0].startTime instanceof Date).toBe(true);
      expect(result.newDocument.variables.varCalendarEvents[0].endTime instanceof Date).toBe(true);
      expect(result.newDocument.variables.varCalendarEvents[0].startTime.getTime())
        .toBe(newContext.variables.varCalendarEvents[0].startTime.getTime());
    });
  });
});
