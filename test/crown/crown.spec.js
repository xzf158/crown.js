define(['hance'], function(hance) {
    describe('test hance inhert', function() {
    	var GrandClass = hance.inherit("GrandClass", function(){});
    	GrandClass.prototype.lastName = "last name";//this one not be override;
    	GrandClass.prototype.firstName = "grand first name";
    	GrandClass.prototype.init = function(){};
    	spyOn(GrandClass.prototype, 'init').andCallThrough();

    	var ParentClass = hance.inherit("ParentClass", GrandClass);
    	ParentClass.prototype.firstName = "father first name";
    	ParentClass.prototype.init = function(){};

    	var ChildClass = hance.inherit("ChildClass", ParentClass);
    	ChildClass.prototype.firstName = "child first name";
    	ChildClass.prototype.init = function(){};

    	var gc = new GrandClass(), pc = new ParentClass(), cc = new ChildClass();
        it('all class instance last name must be same', function() {
            expect(gc.lastName).toEqual('last name');
            expect(gc.lastName).toEqual(pc.lastName);
            expect(gc.lastName).toEqual(cc.lastName);
        });

        it('all class instance first name must be different', function() {
            expect(gc.firstName).toEqual('grand first name');
            expect(pc.firstName).toEqual('father first name');
            expect(cc.firstName).toEqual('child first name');
        });
        it('init function must be called.', function(){
        	expect(gc.init).toHaveBeenCalled();
        });
    });
});
